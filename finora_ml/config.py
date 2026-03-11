"""
config.py — Central config for Finora ML layer.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# .env is at Finora/.env
# config.py is at Finora/finora_ml/config.py
# parent = finora_ml/, parent.parent = Finora/
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env", override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ─── Model Names ───────────────────────────────────────────────────────────────
FINBERT_MODEL = "ProsusAI/finbert"
BART_MODEL    = "facebook/bart-large-mnli"
BGE_MODEL     = "BAAI/bge-large-en-v1.5"
GEMINI_MODEL  = "gemini-2.5-flash"

# ─── ChromaDB ──────────────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR     = "./chroma_db"
CHROMA_COLLECTION_NAME = "finora_events"
HISTORY_TOP_K          = 5
FORCE_RESEED_CHROMA    = os.getenv("FORCE_RESEED_CHROMA", "").strip().lower() in ("1", "true", "yes")

# ─── Sector Definitions ────────────────────────────────────────────────────────
ALL_SECTORS = [
    "defence", "banking", "it", "pharma",
    "energy", "auto", "infra", "fmcg", "metals", "realestate",
]

EVENT_TYPES = [
    "earnings report", "geopolitical tension", "government policy",
    "merger and acquisition", "interest rate decision", "trade deal",
    "natural disaster", "regulatory change", "product launch", "market crash",
]

RISK_APPETITE_OPTIONS = ["conservative", "moderate", "aggressive"]

# ─── Indian Market Sector → Ticker Mapping (NSE) ───────────────────────────────
SECTOR_TICKER_MAP = {
    "defence":    ["HAL.NS", "BEL.NS", "MAZDOCK.NS", "BEML.NS"],
    "banking":    ["HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "KOTAKBANK.NS"],
    "it":         ["TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS"],
    "pharma":     ["SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS"],
    "energy":     ["RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS"],
    "auto":       ["TATAMOTORS.NS", "MARUTI.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS"],
    "infra":      ["LT.NS", "ADANIPORTS.NS", "ULTRACEMCO.NS"],
    "fmcg":       ["HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS"],
    "metals":     ["TATASTEEL.NS", "HINDALCO.NS", "JSWSTEEL.NS"],
    "realestate": ["DLF.NS", "GODREJPROP.NS", "OBEROIRLTY.NS"],
}

SECTOR_INDEX_MAP = {
    "defence":    "^NSEI",
    "banking":    "^NSEBANK",
    "it":         "^CNXIT",
    "pharma":     "^CNXPHARMA",
    "energy":     "^CNXENERGY",
    "auto":       "^CNXAUTO",
    "metals":     "^CNXMETAL",
    "fmcg":       "^CNXFMCG",
    "infra":      "^CNXINFRA",
    "realestate": "^CNXREALTY",
}

TRACKED_ASSETS = [
    "Nifty_50", "Bank_Nifty", "Nifty_IT",
    "Gold_INR", "Crude_Oil", "USD_INR", "Crypto", "Bonds",
]

SIGNAL_WEIGHTS = {
    "sentiment":             0.35,
    "historical_similarity": 0.30,
    "sector_relevance":      0.20,
    "event_confidence":      0.15,
}

DEFAULT_PORTFOLIO_VALUE = 100000.0
DEFAULT_AVG_BUY_PRICE   = 100.0
NEWS_DEFAULT_COUNT      = 15
RELEVANCE_THRESHOLD     = 0.40