import json
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Query, Request

import finora_ml.config as cfg
from finora_ml.infra.http import build_pagination_meta, raise_api_error
from finora_ml.infra.rate_limit import enforce_rate_limit
from finora_ml.pipeline import run_event_pipeline
from finora_ml.schemas import (
    AnalyzeEventRequest,
    ConfigResponse,
    DashboardOverview,
    EventClassificationResult,
    HistoricalEventSummary,
    PaginatedHistoricalEventsResponse,
    SystemStatusResponse,
)
from finora_ml.services.market_service import market_service
from finora_ml.services.news_intelligence_service import news_intelligence_service
from finora_ml.services.runtime_service import runtime_service

router = APIRouter()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
HISTORICAL_JSON_PATH = os.path.join(BASE_DIR, "historical_events.json")


def _load_historical_events() -> list[dict]:
    try:
        with open(HISTORICAL_JSON_PATH, encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        raise_api_error(500, "historical_events_unavailable", "Failed to load historical events.", str(exc))


def _parse_percent(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.strip().replace("%", "")
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def _transform_historical_event(event: dict) -> HistoricalEventSummary:
    return HistoricalEventSummary(
        id=event.get("id", ""),
        event=event.get("event", ""),
        description=event.get("description", ""),
        event_type=event.get("event_type", ""),
        year=event.get("year", 0),
        date=event.get("date", ""),
        primary_sector=event.get("primary_sector", ""),
        sectors_affected=event.get("sectors_affected", []),
        asset_impacts={
            asset: {
                "est_pct_1d": _parse_percent(values.get("est_pct_1d", values.get("1d"))),
                "est_pct_1w": _parse_percent(values.get("est_pct_1w", values.get("1w"))),
                "est_pct_1m": _parse_percent(values.get("est_pct_1m", values.get("1m"))),
            }
            for asset, values in event.get("asset_impacts", {}).items()
            if isinstance(values, dict)
        },
        india_impact=event.get("india_impact", ""),
        reasoning=event.get("reasoning", ""),
        confidence=event.get("confidence", ""),
    )


@router.get("/api/config", response_model=ConfigResponse)
def get_config():
    return ConfigResponse(
        sectors=list(cfg.ALL_SECTORS),
        risk_appetite_options=list(cfg.RISK_APPETITE_OPTIONS),
        event_types=list(cfg.EVENT_TYPES),
        default_portfolio_value=cfg.DEFAULT_PORTFOLIO_VALUE,
        default_avg_buy_price=cfg.DEFAULT_AVG_BUY_PRICE,
        news_default_count=cfg.NEWS_DEFAULT_COUNT,
        history_top_k=cfg.HISTORY_TOP_K,
        tracked_assets=list(cfg.TRACKED_ASSETS),
    )


@router.get("/api/dashboard/overview", response_model=DashboardOverview)
def get_dashboard_overview():
    market_snapshot = market_service.get_market_snapshot()
    live_news = news_intelligence_service.list_live_news(limit=12)
    historical_events = _load_historical_events()
    healthy_quotes = len([item for item in market_snapshot.instruments if item.price is not None])
    coach_readiness = 100 if live_news and healthy_quotes else 65 if live_news or healthy_quotes else 35

    return DashboardOverview(
        markets_tracked=len(market_snapshot.instruments),
        live_articles=len(live_news),
        historical_events=len(historical_events),
        coach_readiness=coach_readiness,
        beginner_message=(
            "Finora translates fast market news into plain-language guidance for first-time investors."
        ),
        last_updated=datetime.utcnow().isoformat(),
    )


@router.get("/api/system/status", response_model=SystemStatusResponse)
def get_system_status():
    return runtime_service.get_status()


@router.post("/api/analyze_event", response_model=EventClassificationResult)
def analyze_event(body: AnalyzeEventRequest, request: Request):
    enforce_rate_limit(request, scope="analyze_event", limit=24, window_seconds=60)
    try:
        return run_event_pipeline(
            event=body.event,
            persona=body.persona,
            run_history=True,
            run_gemini=True,
        )
    except ValueError as exc:
        raise_api_error(422, "analysis_validation_error", str(exc))
    except Exception as exc:
        raise_api_error(500, "analysis_failed", "ML pipeline error.", str(exc))


@router.get("/api/historical-events", response_model=PaginatedHistoricalEventsResponse)
def get_historical_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    limit: Optional[int] = Query(None, ge=1, le=50),
    q: Optional[str] = Query(None, min_length=1, max_length=100),
):
    events = _load_historical_events()
    search = (q or "").strip().lower()
    if search:
        events = [
            event
            for event in events
            if search in event.get("event", "").lower()
            or search in event.get("description", "").lower()
            or search in event.get("primary_sector", "").lower()
            or search in event.get("event_type", "").lower()
        ]

    effective_page_size = limit or page_size
    total_items = len(events)
    meta = build_pagination_meta(page=page, page_size=effective_page_size, total_items=total_items)
    start = (meta.page - 1) * meta.page_size
    end = start + meta.page_size
    items = [_transform_historical_event(event) for event in events[start:end]]

    return PaginatedHistoricalEventsResponse(
        items=items,
        meta=meta,
        last_updated=datetime.utcnow().isoformat(),
    )
