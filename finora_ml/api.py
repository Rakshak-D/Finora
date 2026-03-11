"""
api.py — Finora FastAPI Backend.

Bug fixes vs previous:
  - PortfolioTestResult now imported from schemas (not portfoliotester)
  - /api/health returns ONLY {"status":"ok"} so unit test passes
  - /api/config uses RISK_APPETITE_OPTIONS as plain strings (no .value call)
  - All endpoints use schemas that include avg_asset_impacts for chart rendering
"""

import logging
import os
import sys
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from finora_ml.pipeline import setup_pipeline, run_event_pipeline
from finora_ml.schemas import (
    EventInput, InvestorPersona,
    EventClassificationResult, PortfolioTestResult,
)
from finora_ml.models.newsscraper import get_financial_news
from finora_ml.models.portfoliotester import analyze_portfolio_impact
import finora_ml.config as cfg

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Finora ML API",
    description="AI Event-to-Market Intelligence Engine",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ─────────────────────────────────────────────────────────────

class NewsResponse(BaseModel):
    source:    str
    title:     str
    summary:   str
    url:       str
    timestamp: str


class AnalyzeEventRequest(BaseModel):
    event:   EventInput
    persona: Optional[InvestorPersona] = None


class PortfolioImpactRequest(BaseModel):
    news_text: str
    persona:   InvestorPersona


class ConfigResponse(BaseModel):
    sectors:                List[str]
    risk_appetite_options:  List[str]
    event_types:            List[str]
    default_portfolio_value: float
    default_avg_buy_price:   float
    news_default_count:      int
    history_top_k:           int
    tracked_assets:          List[str]


# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Finora ML API…")
    setup_pipeline()
    logger.info("Finora ML API ready.")


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Health probe. Returns exactly {"status":"ok"} so unit tests pass."""
    return {"status": "ok"}


@app.get("/api/config", response_model=ConfigResponse)
def get_config():
    """
    Public client config. Chrome extension and React frontend call this on load.
    No secrets, no hardcoding in clients.
    """
    return ConfigResponse(
        sectors=list(cfg.ALL_SECTORS),
        # RISK_APPETITE_OPTIONS are plain strings — no .value needed
        risk_appetite_options=list(cfg.RISK_APPETITE_OPTIONS),
        event_types=list(cfg.EVENT_TYPES),
        default_portfolio_value=cfg.DEFAULT_PORTFOLIO_VALUE,
        default_avg_buy_price=cfg.DEFAULT_AVG_BUY_PRICE,
        news_default_count=cfg.NEWS_DEFAULT_COUNT,
        history_top_k=cfg.HISTORY_TOP_K,
        tracked_assets=list(cfg.TRACKED_ASSETS),
    )


@app.get("/api/news", response_model=List[NewsResponse])
def fetch_live_news(count: Optional[int] = None):
    """
    Scrapes live financial news from configured RSS/scrape sources.
    count: max articles (default from config, capped at 50).
    """
    n = max(1, min(count or cfg.NEWS_DEFAULT_COUNT, 50))
    try:
        return get_financial_news(target_count=n)
    except Exception as e:
        logger.error(f"News scrape failed: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Failed to fetch live news: {e}")


@app.post("/api/analyze_event", response_model=EventClassificationResult)
def analyze_event(body: AnalyzeEventRequest):
    """
    Main ML pipeline endpoint.

    Runs FinBERT → BART zero-shot → History Echo (ChromaDB) → Gemini (if deep_analysis=True).

    Response signal_score is 0.0–1.0.
    history_echo.avg_asset_impacts contains per-asset % changes for chart rendering.

    Body:
      { "event": { "text": "...", "deep_analysis": true }, "persona": { ... } }
    """
    try:
        return run_event_pipeline(
            event=body.event,
            persona=body.persona,
            run_history=True,
            run_gemini=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Pipeline error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="ML pipeline error.")


@app.post("/api/portfolio_impact", response_model=PortfolioTestResult)
def portfolio_impact(request: PortfolioImpactRequest):
    """
    Portfolio-aware impact analysis.

    Returns:
      - overall_signal (0.0–1.0)
      - primary_sector_affected
      - estimated_portfolio_impact (human-readable ₹ string)
      - ai_advisory (Gemini-generated)
      - asset_impacts (dict for chart, same keys as avg_asset_impacts)

    Body:
      { "news_text": "...", "persona": { "sectors": ["banking"], "portfolio_value": 500000 } }
    """
    try:
        return analyze_portfolio_impact(request.news_text, request.persona)
    except Exception as e:
        logger.error(f"Portfolio impact error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Portfolio impact analysis failed.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("finora_ml.api:app", host="0.0.0.0", port=8000, reload=True)