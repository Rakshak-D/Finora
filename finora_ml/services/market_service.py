from __future__ import annotations

from datetime import datetime
import os
from typing import Iterable, Optional

import finora_ml.config as cfg
from finora_ml.infra.telemetry import get_logger, log_structured
from finora_ml.providers.market.upstox_provider import UpstoxProvider
from finora_ml.providers.market.yfinance_provider import YFinanceProvider
from finora_ml.schemas import (
    LegacyMarketDataResponse,
    LegacySectorDataResponse,
    MarketCandleResponse,
    MarketSnapshotResponse,
    SectorSnapshotItem,
    SectorSnapshotResponse,
)

logger = get_logger(__name__)


class MarketService:
    def __init__(self):
        self.yfinance_provider = YFinanceProvider()
        self.upstox_provider = UpstoxProvider(access_token=os.getenv("UPSTOX_ACCESS_TOKEN", ""))

    def _provider(self):
        if self.upstox_provider.enabled:
            return self.upstox_provider
        return self.yfinance_provider

    def get_market_snapshot(self, watchlist: Optional[Iterable[str]] = None) -> MarketSnapshotResponse:
        selected = list(watchlist or cfg.TRACKED_ASSETS)
        provider = self._provider()
        instruments = provider.get_instruments(selected)
        log_structured(logger, "market_snapshot", provider=provider.provider_name, count=len(instruments))
        return MarketSnapshotResponse(
            instruments=instruments,
            provider=provider.provider_name,
            partial=any(item.price is None for item in instruments),
            last_updated=datetime.utcnow().isoformat(),
        )

    def get_market_candles(self, instrument: str, interval: str) -> MarketCandleResponse:
        provider = self._provider()
        candles = provider.get_candles(instrument, interval)
        return MarketCandleResponse(
            instrument=instrument,
            interval=interval,
            provider=provider.provider_name,
            candles=candles,
            last_updated=datetime.utcnow().isoformat(),
        )

    def get_sector_snapshot(self) -> SectorSnapshotResponse:
        provider = self._provider()
        sector_items = []
        for sector_key in cfg.ALL_SECTORS:
            try:
                instrument = provider.get_instruments([sector_key])[0]
                sector_items.append(
                    SectorSnapshotItem(
                        key=sector_key,
                        name=sector_key.replace("_", " ").title(),
                        change_percent=instrument.change_percent,
                        linked_symbol=instrument.symbol,
                        market_cap_label="Live market proxy",
                    )
                )
            except Exception as exc:
                log_structured(logger, "sector_snapshot_unavailable", sector=sector_key, provider=provider.provider_name, error=str(exc))
                sector_items.append(
                    SectorSnapshotItem(
                        key=sector_key,
                        name=sector_key.replace("_", " ").title(),
                        change_percent=None,
                        market_cap_label="Unavailable",
                    )
                )
        return SectorSnapshotResponse(
            sectors=sector_items,
            provider=provider.provider_name,
            last_updated=datetime.utcnow().isoformat(),
        )

    def get_legacy_market_data(self) -> LegacyMarketDataResponse:
        snapshot = self.get_market_snapshot()
        indices = [
            {
                "symbol": instrument.id,
                "name": instrument.display_name,
                "price": instrument.price,
                "change": instrument.change,
                "changePercent": instrument.change_percent,
                "volume": None,
                "high": max(instrument.sparkline) if instrument.sparkline else None,
                "low": min(instrument.sparkline) if instrument.sparkline else None,
                "sparkline": instrument.sparkline,
                "status": instrument.status,
            }
            for instrument in snapshot.instruments
        ]
        return LegacyMarketDataResponse(indices=indices, last_updated=snapshot.last_updated)

    def get_legacy_sector_data(self) -> LegacySectorDataResponse:
        sectors = self.get_sector_snapshot()
        payload = [
            {
                "name": sector.name,
                "key": sector.key,
                "change": sector.change_percent,
                "changePercent": sector.change_percent,
                "marketCap": sector.market_cap_label,
                "volume": None,
                "advances": sector.leaders,
                "declines": sector.laggards,
            }
            for sector in sectors.sectors
        ]
        return LegacySectorDataResponse(sectors=payload, last_updated=sectors.last_updated)


market_service = MarketService()
