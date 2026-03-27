from __future__ import annotations

from datetime import datetime
import logging
from typing import Iterable, List

import pandas as pd
import yfinance as yf

import finora_ml.config as cfg
from finora_ml.providers.market.base import MarketProvider
from finora_ml.schemas import MarketCandle, MarketInstrument

logger = logging.getLogger(__name__)

MARKET_CATALOG = {
    "Nifty_50": {"symbol": "^NSEI", "name": "Nifty 50", "category": "index", "market": "NSE", "currency": "INR"},
    "Bank_Nifty": {"symbol": "^NSEBANK", "name": "Bank Nifty", "category": "index", "market": "NSE", "currency": "INR"},
    "Nifty_IT": {"symbol": "^CNXIT", "name": "Nifty IT", "category": "index", "market": "NSE", "currency": "INR"},
    "Sensex": {"symbol": "^BSESN", "name": "Sensex", "category": "index", "market": "BSE", "currency": "INR"},
    "Gold_INR": {"symbol": "GOLDBEES.NS", "name": "Gold BeES", "category": "commodity", "market": "NSE", "currency": "INR"},
    "Crude_Oil": {"symbol": "CL=F", "name": "Crude Oil", "category": "commodity", "market": "MCX", "currency": "USD"},
    "USD_INR": {"symbol": "INR=X", "name": "USD/INR", "category": "fx", "market": "FX", "currency": "INR"},
    "Crypto": {"symbol": "BTC-USD", "name": "Bitcoin", "category": "crypto", "market": "Crypto", "currency": "USD"},
    "Bonds": {"symbol": "^TNX", "name": "US 10Y Yield", "category": "bond", "market": "Global", "currency": "USD"},
}

MARKET_CATALOG.update(
    {
        key: {
            "symbol": value,
            "name": key.replace("_", " "),
            "category": "sector",
            "market": "NSE",
            "currency": "INR",
        }
        for key, value in cfg.SECTOR_INDEX_MAP.items()
    }
)

INTERVAL_TO_HISTORY = {
    "1m": {"period": "1d", "interval": "1m"},
    "5m": {"period": "5d", "interval": "5m"},
    "1d": {"period": "6mo", "interval": "1d"},
    "1w": {"period": "2y", "interval": "1wk"},
}


class YFinanceProvider(MarketProvider):
    provider_name = "yfinance"

    def _lookup(self, instrument: str) -> dict:
        return MARKET_CATALOG.get(
            instrument,
            {
                "symbol": instrument,
                "name": instrument,
                "category": "asset",
                "market": "Unknown",
                "currency": "USD",
            },
        )

    def _download_history(self, symbol: str, period: str, interval: str) -> pd.DataFrame:
        try:
            frame = yf.download(
                tickers=symbol,
                period=period,
                interval=interval,
                progress=False,
                auto_adjust=False,
                threads=False,
            )
        except Exception as exc:
            logger.warning("yfinance download failed for %s (%s/%s): %s", symbol, period, interval, exc)
            return pd.DataFrame()
        if isinstance(frame.columns, pd.MultiIndex):
            frame = frame.xs(symbol, level=-1, axis=1)
        return frame.dropna(how="all")

    def get_instruments(self, instruments: Iterable[str]) -> List[MarketInstrument]:
        results: List[MarketInstrument] = []
        for instrument in instruments:
            metadata = self._lookup(instrument)
            history = self._download_history(metadata["symbol"], "10d", "1d")
            if history.empty or "Close" not in history.columns:
                results.append(
                    MarketInstrument(
                        id=instrument,
                        symbol=metadata["symbol"],
                        display_name=metadata["name"],
                        category=metadata["category"],
                        market=metadata["market"],
                        currency=metadata["currency"],
                        provider=self.provider_name,
                        session="closed",
                        status="unavailable",
                    )
                )
                continue

            closes = history["Close"].astype(float).tail(8)
            latest = float(closes.iloc[-1])
            previous = float(closes.iloc[-2]) if len(closes) > 1 else latest
            change = latest - previous
            change_percent = (change / previous * 100.0) if previous else None
            results.append(
                MarketInstrument(
                    id=instrument,
                    symbol=metadata["symbol"],
                    display_name=metadata["name"],
                    category=metadata["category"],
                    market=metadata["market"],
                    currency=metadata["currency"],
                    provider=self.provider_name,
                    price=round(latest, 2),
                    change=round(change, 2),
                    change_percent=round(change_percent, 2) if change_percent is not None else None,
                    sparkline=[round(float(value), 2) for value in closes.tolist()],
                    session="open",
                    status="live",
                    last_updated=datetime.utcnow().isoformat(),
                )
            )
        return results

    def get_candles(self, instrument: str, interval: str) -> List[MarketCandle]:
        metadata = self._lookup(instrument)
        history_config = INTERVAL_TO_HISTORY.get(interval, INTERVAL_TO_HISTORY["1d"])
        history = self._download_history(metadata["symbol"], history_config["period"], history_config["interval"])
        if history.empty:
            return []

        candles: List[MarketCandle] = []
        for index, row in history.tail(120).iterrows():
            candles.append(
                MarketCandle(
                    time=index.to_pydatetime().isoformat() if hasattr(index, "to_pydatetime") else str(index),
                    open=round(float(row["Open"]), 2),
                    high=round(float(row["High"]), 2),
                    low=round(float(row["Low"]), 2),
                    close=round(float(row["Close"]), 2),
                    volume=float(row.get("Volume", 0) or 0),
                )
            )
        return candles
