import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from finora_ml.infra.rate_limit import enforce_rate_limit
from finora_ml.services.market_service import market_service
from finora_ml.services.news_intelligence_service import news_intelligence_service

router = APIRouter()


def _sse_payload(event_type: str, payload) -> str:
    return (
        f"data: {json.dumps({'type': event_type, 'timestamp': datetime.utcnow().isoformat(), 'payload': payload})}\n\n"
    )


@router.get("/api/stream/market")
async def stream_market(request: Request):
    enforce_rate_limit(request, scope="stream_market", limit=6, window_seconds=60)
    async def event_generator():
        while True:
            snapshot = market_service.get_market_snapshot()
            yield _sse_payload("market.snapshot", snapshot.model_dump(mode="json"))
            await asyncio.sleep(15)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/api/stream/news")
async def stream_news(request: Request):
    enforce_rate_limit(request, scope="stream_news", limit=6, window_seconds=60)
    async def event_generator():
        while True:
            news = news_intelligence_service.list_live_news(limit=8)
            payload = [article.model_dump(mode="json") for article in news]
            yield _sse_payload("news.live", payload)
            await asyncio.sleep(45)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
