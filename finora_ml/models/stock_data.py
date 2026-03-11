"""
stock_data.py — Real-time stock data fetching using yfinance.

This module provides functions to fetch real-time stock market data
for Indian and US markets using the yfinance library.
"""

import logging
from typing import List, Dict, Optional, Any
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Indian stock tickers (NSE)
INDIAN_TICKERS = {
    "NIFTY": "^NSEI",
    "SENSEX": "^BSESN",
    "BANK_NIFTY": "^NSEBANK",
    "NIFTY_IT": "^CNXIT",
    "NIFTY_PHARMA": "^CNXPHARMA",
    "NIFTY_AUTO": "^CNXAUTO",
    "NIFTY_METAL": "^CNXMETAL",
    "NIFTY_FMCG": "^CNXFMCG",
    "NIFTY_INFRA": "^CNXINFRA",
    "NIFTY_REALTY": "^CNXREALTY",
}

# US stock tickers
US_TICKERS = {
    "NASDAQ": "^IXIC",
    "DOW": "^DJI",
    "SP500": "^GSPC",
    "BTC": "BTC-USD",
    "ETH": "ETH-USD",
    "GOLD": "GC=F",
    "OIL": "CL=F",
    "SILVER": "SI=F",
}

# Indian stock symbols for direct fetch
INDIAN_STOCKS = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "INFY": "INFY.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "SBIN": "SBIN.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "ADANIPORTS": "ADANIPORTS.NS",
    "LT": "LT.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
}


def get_market_index_data(ticker_key: str) -> Optional[Dict[str, Any]]:
    """
    Fetch real-time data for a market index.
    
    Args:
        ticker_key: The ticker key (e.g., "NIFTY", "SENSEX", "NASDAQ")
    
    Returns:
        Dictionary with market data or None if fetch fails
    """
    # Check Indian indices first
    if ticker_key in INDIAN_TICKERS:
        ticker = INDIAN_TICKERS[ticker_key]
    elif ticker_key in US_TICKERS:
        ticker = US_TICKERS[ticker_key]
    else:
        # Try as direct ticker
        ticker = ticker_key
        
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get current price and previous close
        current_price = info.get('currentPrice') or info.get('regularMarketPreviousClose')
        prev_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
        
        if current_price is None:
            # Try to get from fast_info
            fast_info = stock.fast_info
            current_price = getattr(fast_info, 'last_price', None)
            prev_close = getattr(fast_info, 'previous_close', None)
        
        if current_price is None:
            return None
            
        # Calculate change
        change = current_price - prev_close if prev_close else 0
        change_pct = (change / prev_close * 100) if prev_close else 0
        
        return {
            "symbol": ticker_key,
            "price": current_price,
            "previous_close": prev_close,
            "change": change,
            "change_pct": change_pct,
            "day_high": info.get('dayHigh'),
            "day_low": info.get('dayLow'),
            "52_week_high": info.get('fiftyTwoWeekHigh'),
            "52_week_low": info.get('fiftyTwoWeekLow'),
            "market_cap": info.get('marketCap'),
            "volume": info.get('volume'),
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching data for {ticker_key}: {e}")
        return None


def get_historical_data(ticker_key: str, period: str = "1mo", interval: str = "1d") -> List[Dict]:
    """
    Fetch historical price data for a ticker.
    
    Args:
        ticker_key: Stock ticker key
        period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max)
        interval: Data interval (1m, 5m, 1h, 1d, 1wk, 1mo)
    
    Returns:
        List of dictionaries with OHLCV data
    """
    # Resolve ticker
    ticker = None
    if ticker_key in INDIAN_TICKERS:
        ticker = INDIAN_TICKERS[ticker_key]
    elif ticker_key in US_TICKERS:
        ticker = US_TICKERS[ticker_key]
    elif ticker_key in INDIAN_STOCKS:
        ticker = INDIAN_STOCKS[ticker_key]
    else:
        ticker = ticker_key
    
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period, interval=interval)
        
        if hist.empty:
            return []
        
        records = []
        for idx, row in hist.iterrows():
            records.append({
                "date": idx.isoformat() if isinstance(idx, pd.Timestamp) else str(idx),
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
        
        return records
    except Exception as e:
        logger.error(f"Error fetching historical data for {ticker_key}: {e}")
        return []


def get_stock_quote(ticker: str) -> Optional[Dict[str, Any]]:
    """
    Get detailed quote for a specific stock ticker.
    
    Args:
        ticker: Stock ticker symbol (e.g., "RELIANCE.NS", "AAPL")
    
    Returns:
        Dictionary with detailed stock information
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        return {
            "ticker": ticker,
            "name": info.get('longName') or info.get('shortName'),
            "current_price": info.get('currentPrice'),
            "previous_close": info.get('previousClose'),
            "open": info.get('open'),
            "day_high": info.get('dayHigh'),
            "day_low": info.get('dayLow'),
            "52_week_high": info.get('fiftyTwoWeekHigh'),
            "52_week_low": info.get('fiftyTwoWeekLow'),
            "market_cap": info.get('marketCap'),
            "volume": info.get('volume'),
            "avg_volume": info.get('averageVolume'),
            "pe_ratio": info.get('trailingPE'),
            "eps": info.get('trailingEps'),
            "dividend_yield": info.get('dividendYield'),
            "beta": info.get('beta'),
            "sector": info.get('sector'),
            "industry": info.get('industry'),
            "description": info.get('longBusinessSummary', '')[:500],
            "last_updated": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching quote for {ticker}: {e}")
        return None


def get_top_movers(limit: int = 10) -> Dict[str, List[Dict]]:
    """
    Get top gaining and losing stocks from major indices.
    
    Returns:
        Dictionary with 'gainers' and 'losers' lists
    """
    # For now, return sample data - can be expanded with live data
    return {
        "gainers": [
            {"symbol": "ADANIPORTS", "name": "Adani Ports", "change_pct": 5.2},
            {"symbol": "HINDUNILVR", "name": "Hindustan Unilever", "change_pct": 3.8},
            {"symbol": "INFY", "name": "Infosys", "change_pct": 2.9},
        ],
        "losers": [
            {"symbol": "BAJAJFINSV", "name": "Bajaj Finserv", "change_pct": -4.2},
            {"symbol": "ADANI", "name": "Adani Enterprises", "change_pct": -3.5},
            {"symbol": "TITAN", "name": "Titan Company", "change_pct": -2.1},
        ]
    }


def get_market_summary() -> Dict[str, Any]:
    """
    Get overall market summary with real-time data.
    
    Returns:
        Dictionary with market summary data
    """
    indices_data = []
    
    # Fetch major indices
    for key in ["NIFTY", "SENSEX", "BANK_NIFTY", "NASDAQ", "SP500", "BTC", "GOLD"]:
        data = get_market_index_data(key)
        if data:
            indices_data.append(data)
    
    return {
        "indices": indices_data,
        "timestamp": datetime.now().isoformat(),
        "market_status": "open" if 9 <= datetime.now().hour <= 15 else "closed"
    }

