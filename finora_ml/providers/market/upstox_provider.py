from __future__ import annotations

from typing import Iterable, List

from finora_ml.providers.market.base import MarketProvider
from finora_ml.schemas import MarketCandle, MarketInstrument


class UpstoxProvider(MarketProvider):
    provider_name = "upstox"

    def __init__(self, access_token: str = "", instrument_map: dict[str, str] | None = None):
        self.access_token = access_token
        self.instrument_map = instrument_map or {}

    @property
    def enabled(self) -> bool:
        return bool(self.access_token and self.instrument_map)

    def get_instruments(self, instruments: Iterable[str]) -> List[MarketInstrument]:
        if not self.enabled:
            raise RuntimeError("Upstox provider is not configured")
        raise NotImplementedError("Upstox integration is configured as an upgrade path but not active in this environment")

    def get_candles(self, instrument: str, interval: str) -> List[MarketCandle]:
        if not self.enabled:
            raise RuntimeError("Upstox provider is not configured")
        raise NotImplementedError("Upstox candle integration is configured as an upgrade path but not active in this environment")
