"""
config.py — Central config for Finora ML layer.
Change model names, API keys, and mappings here only.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── API Keys ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ─── Model Names ───────────────────────────────────────────────────────────────
FINBERT_MODEL     = "ProsusAI/finbert"
BART_MODEL        = "facebook/bart-large-mnli"
BGE_MODEL         = "BAAI/bge-large-en-v1.5"
GEMINI_MODEL      = "gemini-3-flash-preview"

# ─── ChromaDB ──────────────────────────────────────────────────────────────────
CHROMA_PERSIST_DIR      = "./chroma_db"
CHROMA_COLLECTION_NAME  = "finora_events"
HISTORY_TOP_K           = 3

# ─── Sector Definitions ────────────────────────────────────────────────────────
ALL_SECTORS = [
    "defence", "banking", "it", "pharma",
    "energy", "auto", "infra", "fmcg", "metals", "realestate"
]

EVENT_TYPES = [
    "earnings report", "geopolitical tension", "government policy",
    "merger and acquisition", "interest rate decision", "trade deal",
    "natural disaster", "regulatory change", "product launch", "market crash"
]

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

# ─── Signal Score Weights ──────────────────────────────────────────────────────
SIGNAL_WEIGHTS = {
    "sentiment":            0.35,
    "historical_similarity": 0.30,
    "sector_relevance":     0.20,
    "event_confidence":     0.15,
}

RELEVANCE_THRESHOLD = 0.40