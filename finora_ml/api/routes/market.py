from typing import Optional

from fastapi import APIRouter, Query

from finora_ml.infra.http import raise_api_error
from finora_ml.schemas import (
    LegacyMarketDataResponse,
    LegacySectorDataResponse,
    MarketCandleResponse,
    MarketSnapshotResponse,
    SectorSnapshotResponse,
)
from finora_ml.services.market_service import market_service

router = APIRouter()


@router.get("/api/market/snapshot", response_model=MarketSnapshotResponse)
def get_market_snapshot(watchlist: Optional[str] = None):
    watchlist_items = [item.strip() for item in watchlist.split(",") if item.strip()] if watchlist else None
    if watchlist_items and len(watchlist_items) > 12:
        raise_api_error(422, "watchlist_too_large", "Watchlist accepts up to 12 instruments per request.")
    return market_service.get_market_snapshot(watchlist_items)


@router.get("/api/market/candles", response_model=MarketCandleResponse)
def get_market_candles(
    instrument: str = Query(..., min_length=1),
    interval: str = Query("1d"),
):
    if interval not in {"1m", "5m", "1d", "1w"}:
        raise_api_error(422, "invalid_interval", "Interval must be one of: 1m, 5m, 1d, 1w.")
    return market_service.get_market_candles(instrument, interval)


@router.get("/api/market/sectors", response_model=SectorSnapshotResponse)
def get_sector_snapshot():
    return market_service.get_sector_snapshot()


@router.get("/api/market-data", response_model=LegacyMarketDataResponse)
def get_legacy_market_data():
    return market_service.get_legacy_market_data()


@router.get("/api/sector-data", response_model=LegacySectorDataResponse)
def get_legacy_sector_data():
    return market_service.get_legacy_sector_data()
