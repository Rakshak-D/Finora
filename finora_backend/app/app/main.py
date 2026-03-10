from fastapi import FastAPI
from pydantic import BaseModel
import re

app = FastAPI(title="Finora")


class HeadlineRequest(BaseModel):
    headline: str


# ── Simple keyword-based classifier (mock until teammate's model is ready) ─────

CATEGORY_KEYWORDS = {
    "war_conflict"       : ["war", "military", "invasion", "troops", "nato", "missile", "bomb", "conflict", "attack", "sanction", "ukraine", "russia", "israel", "hamas", "nuclear", "weapon", "ceasefire"],
    "banking_finance"    : ["bank", "banking", "loan", "credit", "mortgage", "jpmorgan", "goldman", "wells fargo", "citigroup", "hsbc", "barclays", "lending", "deposit"],
    "monetary_policy"    : ["federal reserve", "fed", "interest rate", "rate hike", "rate cut", "inflation", "cpi", "ecb", "central bank", "basis points", "fomc", "bond yield", "quantitative"],
    "energy_commodities" : ["oil", "crude", "opec", "brent", "wti", "natural gas", "energy", "petroleum", "coal", "gold", "silver", "copper", "commodity"],
    "trade_tariffs"      : ["tariff", "trade war", "trade deal", "import", "export", "customs", "embargo", "trade deficit", "protectionism"],
    "crypto_digital"     : ["bitcoin", "ethereum", "crypto", "cryptocurrency", "blockchain", "defi", "nft", "token", "coinbase", "binance", "web3"],
    "earnings_corporate" : ["earnings", "revenue", "profit", "eps", "quarterly", "ipo", "merger", "acquisition", "dividend", "buyback", "layoff", "ceo", "guidance"],
    "macro_economic"     : ["gdp", "unemployment", "jobs report", "payroll", "pmi", "retail sales", "recession", "economic growth", "stimulus", "fiscal"],
    "politics_election"  : ["election", "president", "congress", "senate", "government", "parliament", "vote", "legislation", "policy", "white house"],
    "tech_innovation"    : ["ai", "artificial intelligence", "semiconductor", "chip", "nvidia", "apple", "google", "microsoft", "meta", "amazon", "openai", "cloud", "tesla"],
    "natural_disaster"   : ["earthquake", "hurricane", "flood", "wildfire", "typhoon", "tsunami", "tornado", "disaster", "drought"],
    "regulatory"         : ["sec", "cftc", "antitrust", "fine", "penalty", "investigation", "lawsuit", "compliance", "enforcement", "ruling"],
}


def mock_classify(headline: str) -> dict:
    lower  = headline.lower()
    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        matched = []
        for kw in keywords:
            if re.search(r"\b" + re.escape(kw) + r"\b", lower):
                score  += 2 if " " in kw else 1
                matched.append(kw)
        if score > 0:
            scores[category] = {"score": score, "matched": matched}

    if not scores:
        return {
            "primary_category"  : "other",
            "secondary_category": None,
            "confidence_score"  : 0.5,
            "keywords"          : [],
            "note"              : "mock classifier — replace with teammate model",
        }

    sorted_cats = sorted(scores.items(), key=lambda x: x[1]["score"], reverse=True)
    primary     = sorted_cats[0]
    secondary   = sorted_cats[1] if len(sorted_cats) > 1 else None
    total       = sum(v["score"] for v in scores.values())
    confidence  = round(min(primary[1]["score"] / total, 1.0), 4)

    return {
        "primary_category"  : primary[0],
        "secondary_category": secondary[0] if secondary else None,
        "confidence_score"  : confidence,
        "keywords"          : primary[1]["matched"][:6],
        "note"              : "mock classifier — replace with teammate model",
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "Finora successfully running"}


@app.post("/classify")
def classify(req: HeadlineRequest):
    """
    Paste a headline → get back event classification.
    Uses a mock keyword classifier until teammate's model is ready.
    """
    if not req.headline.strip():
        return {"error": "Headline cannot be empty."}

    return mock_classify(req.headline)