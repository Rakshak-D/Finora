from abc import ABC, abstractmethod
from typing import Iterable, List

from finora_ml.schemas import MarketCandle, MarketInstrument


class MarketProvider(ABC):
    provider_name = "unknown"

    @abstractmethod
    def get_instruments(self, instruments: Iterable[str]) -> List[MarketInstrument]:
        raise NotImplementedError

    @abstractmethod
    def get_candles(self, instrument: str, interval: str) -> List[MarketCandle]:
        raise NotImplementedError
