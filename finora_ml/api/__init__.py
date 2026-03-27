import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import finora_ml.config as cfg
from finora_ml.api.routes.analysis import router as analysis_router
from finora_ml.api.routes.market import router as market_router
from finora_ml.api.routes.news import router as news_router
from finora_ml.api.routes.portfolio import router as portfolio_router
from finora_ml.api.routes.predictions import router as predictions_router
from finora_ml.api.routes.stream import router as stream_router
from finora_ml.infra.http import build_error_response
from finora_ml.pipeline import setup_pipeline

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Finora ML API",
    description="India-first financial coaching and market intelligence API",
    version="3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if cfg.ALLOW_ALL_CORS else cfg.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and {"code", "message"}.issubset(detail.keys()):
        payload = {"error": detail}
    elif isinstance(detail, str):
        payload = build_error_response(code="http_error", message=detail).model_dump()
    else:
        payload = build_error_response(code="http_error", message="Request failed.", details=detail).model_dump()
    return JSONResponse(
        status_code=exc.status_code,
        content=jsonable_encoder(payload, custom_encoder={Exception: str}),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    serialized_errors = jsonable_encoder(exc.errors(), custom_encoder={Exception: str})
    payload = build_error_response(
        code="validation_error",
        message="Request validation failed.",
        details=serialized_errors,
    ).model_dump()
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(payload, custom_encoder={Exception: str}),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Unhandled server exception", exc_info=exc)
    payload = build_error_response(
        code="server_error",
        message="An unexpected server error occurred.",
    ).model_dump()
    return JSONResponse(
        status_code=500,
        content=jsonable_encoder(payload, custom_encoder={Exception: str}),
    )


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"

    if request.method == "GET":
        if request.url.path in {"/api/config", "/api/historical-events"}:
            response.headers["Cache-Control"] = "public, max-age=300"
        elif request.url.path in {"/api/news/live", "/api/dashboard/overview", "/api/market/snapshot", "/api/market/sectors"}:
            response.headers["Cache-Control"] = "public, max-age=60"
        else:
            response.headers["Cache-Control"] = "no-store"
    else:
        response.headers["Cache-Control"] = "no-store"

    return response


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Finora API...")
    if cfg.MODEL_WARMUP_ON_STARTUP:
        setup_pipeline()
    logger.info("Finora API ready.")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(analysis_router)
app.include_router(market_router)
app.include_router(news_router)
app.include_router(portfolio_router)
app.include_router(predictions_router)
app.include_router(stream_router)
