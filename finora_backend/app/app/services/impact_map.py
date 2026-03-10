"""
services/impact_mapper.py

Computes market impact score using:
  - Sentiment from your FinBERT service
  - Classification from teammate's model

impact_score  : 0.0 – 10.0
impact_level  : high / medium / low
"""

import logging
from app.models.schemas import SentimentLabel, MarketImpact, SentimentResult, ClassificationResult, ImpactResult

logger = logging.getLogger("finora.impact")

# ── Category → sector / index mappings ────────────────────────────────────────

CATEGORY_SECTORS: dict[str, list[str]] = {
    "war_conflict"       : ["Defense", "Energy", "Commodities", "Airlines"],
    "banking_finance"    : ["Financials", "Banks", "Insurance"],
    "monetary_policy"    : ["Financials", "Real Estate", "Utilities", "Bonds"],
    "energy_commodities" : ["Energy", "Materials", "Industrials"],
    "trade_tariffs"      : ["Industrials", "Consumer Discretionary", "Technology"],
    "crypto_digital"     : ["Technology", "Financials"],
    "earnings_corporate" : ["Broad Market"],
    "macro_economic"     : ["Broad Market", "Consumer Staples", "Industrials"],
    "politics_election"  : ["Broad Market", "Healthcare", "Energy"],
    "tech_innovation"    : ["Technology", "Consumer Discretionary"],
    "natural_disaster"   : ["Insurance", "Utilities", "Agriculture"],
    "regulatory"         : ["Financials", "Technology", "Healthcare"],
    "other"              : ["Broad Market"],
}

CATEGORY_INDICES: dict[str, list[str]] = {
    "war_conflict"       : ["S&P 500", "VIX", "Gold Futures"],
    "banking_finance"    : ["KBW Bank Index", "S&P Financials"],
    "monetary_policy"    : ["S&P 500", "NASDAQ", "10Y Treasury"],
    "energy_commodities" : ["S&P Energy", "WTI Crude", "Brent"],
    "trade_tariffs"      : ["S&P 500", "Dow Jones", "USD Index"],
    "crypto_digital"     : ["Bitcoin", "Ethereum", "Total Market Cap"],
    "earnings_corporate" : ["S&P 500", "NASDAQ", "Dow Jones"],
    "macro_economic"     : ["S&P 500", "10Y Treasury", "USD Index"],
    "politics_election"  : ["S&P 500", "VIX"],
    "tech_innovation"    : ["NASDAQ 100", "SOX Semiconductor"],
    "natural_disaster"   : ["S&P 500", "CAT Bond Index"],
    "regulatory"         : ["S&P 500", "S&P Financials", "NASDAQ"],
    "other"              : ["S&P 500"],
}

CATEGORY_BASE_IMPACT: dict[str, float] = {
    "war_conflict"       : 8.5,
    "banking_finance"    : 8.0,
    "monetary_policy"    : 9.0,
    "energy_commodities" : 7.5,
    "trade_tariffs"      : 7.0,
    "crypto_digital"     : 6.0,
    "earnings_corporate" : 7.5,
    "macro_economic"     : 8.0,
    "politics_election"  : 6.5,
    "tech_innovation"    : 6.0,
    "natural_disaster"   : 5.5,
    "regulatory"         : 6.5,
    "other"              : 3.0,
}

CATEGORY_RATIONALE: dict[str, str] = {
    "war_conflict"       : "Geopolitical conflict triggers risk-off sentiment, boosting safe-haven assets while pressuring equities.",
    "banking_finance"    : "Banking sector news directly affects financial stocks, credit markets, and broader market liquidity.",
    "monetary_policy"    : "Central bank decisions are the highest-impact macro driver, affecting all asset classes.",
    "energy_commodities" : "Energy and commodity moves affect input costs across industrials, transport, and consumers.",
    "trade_tariffs"      : "Trade policy shifts affect multinational earnings, supply chains, and currencies.",
    "crypto_digital"     : "Crypto news impacts digital asset markets with spillovers to fintech and tech equities.",
    "earnings_corporate" : "Corporate earnings drive individual stock moves and sector rotation.",
    "macro_economic"     : "Macro data surprises reprice growth and inflation expectations across all markets.",
    "politics_election"  : "Political events introduce policy uncertainty, increasing market volatility.",
    "tech_innovation"    : "Tech developments affect high-growth valuations and sector leadership.",
    "natural_disaster"   : "Physical disruptions affect insurance, utilities, and regional economic output.",
    "regulatory"         : "Regulatory actions change the operating environment and sector profitability.",
    "other"              : "General news event with potential but unquantified market implications.",
}

COMPANY_MAP: dict[str, str] = {
    "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
    "amazon": "AMZN", "meta": "META", "nvidia": "NVDA", "tesla": "TSLA",
    "jpmorgan": "JPM", "goldman sachs": "GS", "bank of america": "BAC",
    "wells fargo": "WFC", "citigroup": "C", "morgan stanley": "MS",
    "exxon": "XOM", "chevron": "CVX", "boeing": "BA", "lockheed": "LMT",
    "coinbase": "COIN", "hsbc": "HSBC", "barclays": "BARC", "ubs": "UBS",
}

URGENCY_WORDS = [
    "emergency", "crash", "collapse", "record", "unprecedented", "crisis",
    "halt", "suspend", "ban", "surge", "plunge", "breaking",
]


def map_impact(
    text: str,
    sentiment: SentimentResult,
    classification: ClassificationResult,
) -> ImpactResult:
    lower    = text.lower()
    category = classification.primary_category   # plain string from teammate model

    base    = CATEGORY_BASE_IMPACT.get(category, 3.0)
    urgency = min(sum(1 for kw in URGENCY_WORDS if kw in lower) * 0.4, 2.0)
    mult    = (1.1  if sentiment.label == SentimentLabel.NEGATIVE else
               0.95 if sentiment.label == SentimentLabel.POSITIVE  else 0.85)

    raw_score    = (base + urgency) * mult
    impact_score = round(min(raw_score * classification.confidence_score + raw_score * 0.3, 10.0), 2)

    impact_level = (MarketImpact.HIGH   if impact_score >= 7.0 else
                    MarketImpact.MEDIUM if impact_score >= 4.5 else
                    MarketImpact.LOW)

    # Sectors: primary + secondary (if model returns one)
    sectors = list(dict.fromkeys(
        CATEGORY_SECTORS.get(category, ["Broad Market"]) +
        (CATEGORY_SECTORS.get(classification.secondary_category, [])
         if classification.secondary_category else [])
    ))[:4]

    indices   = CATEGORY_INDICES.get(category, ["S&P 500"])
    companies = [f"{n.title()} ({t})" for n, t in COMPANY_MAP.items() if n in lower][:5]
    rationale = CATEGORY_RATIONALE.get(category, "General market event.")

    return ImpactResult(
        impact_level      = impact_level,
        impact_score      = impact_score,
        affected_sectors  = sectors,
        affected_companies= companies,
        affected_indices  = indices,
        rationale         = rationale,
    )