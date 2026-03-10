"""
services/classification_service.py

Zero-shot event classification using BART-large-MNLI:
  Model : facebook/bart-large-mnli
  Task  : zero-shot-classification

Each news headline is scored against all 13 Finora event-category
labels in a single forward pass. The model returns a probability for
each label — no labelled training data required.

The pipeline is loaded once (lazy, cached) and reused across requests.
Models are cached in ~/.cache/huggingface after the first download.
"""

import logging
from functools import lru_cache
from app.models.schemas import EventCategory, ClassificationResult

logger = logging.getLogger("finora.classification")


CANDIDATE_LABELS: list[str] = [
    "war, military conflict, geopolitical tension, or sanctions",
    "banking, finance, loans, credit, or financial institutions",
    "monetary policy, interest rates, central bank, or inflation",
    "energy, oil, commodities, gold, or natural resources",
    "trade, tariffs, import and export policy, or trade war",
    "cryptocurrency, bitcoin, blockchain, or digital assets",
    "corporate earnings, revenue, mergers, acquisitions, or IPO",
    "macroeconomic data, GDP, unemployment, or economic growth",
    "politics, elections, government policy, or legislation",
    "technology, artificial intelligence, semiconductors, or innovation",
    "natural disaster, earthquake, hurricane, flood, or climate event",
    "financial regulation, SEC enforcement, legal action, or compliance",
]

_INDEX_TO_CATEGORY: dict[int, EventCategory] = {
    0 : EventCategory.WAR_CONFLICT,
    1 : EventCategory.BANKING_FINANCE,
    2 : EventCategory.MONETARY_POLICY,
    3 : EventCategory.ENERGY_COMMODITIES,
    4 : EventCategory.TRADE_TARIFFS,
    5 : EventCategory.CRYPTO_DIGITAL,
    6 : EventCategory.EARNINGS_CORPORATE,
    7 : EventCategory.MACRO_ECONOMIC,
    8 : EventCategory.POLITICS_ELECTION,
    9 : EventCategory.TECH_INNOVATION,
    10: EventCategory.NATURAL_DISASTER,
    11: EventCategory.REGULATORY,
}

@lru_cache(maxsize=1)
def _get_pipeline():
    """Load BART-large-MNLI zero-shot pipeline once and cache it."""
    try:
        from transformers import pipeline
        logger.info("Loading BART-large-MNLI (facebook/bart-large-mnli)... may take a moment on first run.")
        pipe = pipeline(
            task="zero-shot-classification",
            model="facebook/bart-large-mnli",
            truncation=True,
            max_length=1024,
        )
        logger.info("BART-large-MNLI loaded successfully.")
        return pipe
    except Exception as e:
        logger.error(f"Failed to load BART-large-MNLI: {e}")
        return None

import re

_ALL_KEYWORDS: list[str] = [
    "war", "military", "invasion", "nato", "conflict", "missile", "sanction",
    "bank", "loan", "credit", "mortgage", "jpmorgan", "goldman sachs",
    "federal reserve", "fed", "interest rate", "rate hike", "inflation", "cpi",
    "oil", "crude", "opec", "brent", "wti", "natural gas", "gold", "commodity",
    "tariff", "trade war", "trade deal", "import", "export", "embargo",
    "bitcoin", "ethereum", "crypto", "blockchain", "defi", "nft",
    "earnings", "revenue", "profit", "eps", "ipo", "merger", "acquisition", "dividend",
    "gdp", "unemployment", "jobs report", "pmi", "recession", "stimulus",
    "election", "president", "congress", "senate", "government", "legislation",
    "ai", "artificial intelligence", "semiconductor", "chip", "nvidia", "cloud",
    "earthquake", "hurricane", "flood", "wildfire", "typhoon", "disaster",
    "sec", "cftc", "antitrust", "fine", "investigation", "lawsuit", "compliance",
]

def _extract_keywords(text: str, top_n: int = 6) -> list[str]:
    lower   = text.lower()
    matched = []
    seen: set[str] = set()
    for kw in sorted(_ALL_KEYWORDS, key=len, reverse=True):
        if re.search(r"\b" + re.escape(kw) + r"\b", lower) and kw not in seen:
            seen.add(kw)
            matched.append(kw)
    return matched[:top_n]

def classify_event(text: str) -> ClassificationResult:
    """
    Classify a news headline into one of 13 Finora event categories
    using BART-large-MNLI zero-shot classification.

    Returns:
        ClassificationResult with primary + secondary category,
        confidence score, and extracted keywords.

    Falls back to EventCategory.OTHER if the model is unavailable.
    """
    if not text or not text.strip():
        return ClassificationResult(
            primary_category=EventCategory.OTHER,
            confidence_score=0.5,
            keywords=[],
        )

    pipe = _get_pipeline()

    if pipe is None:
        logger.warning("BART-large-MNLI unavailable — returning OTHER fallback.")
        return ClassificationResult(
            primary_category=EventCategory.OTHER,
            confidence_score=0.5,
            keywords=_extract_keywords(text),
        )

    try:
        result = pipe(
            text,
            candidate_labels=CANDIDATE_LABELS,
            multi_label=False,   # single best category per article
        )

        # result["labels"] is sorted highest → lowest score
        top_label   = result["labels"][0]
        top_score   = round(result["scores"][0], 4)
        sec_label   = result["labels"][1] if len(result["labels"]) > 1 else None

        # Map descriptive label string → index → EventCategory
        label_to_idx = {lbl: idx for idx, lbl in enumerate(CANDIDATE_LABELS)}

        primary_idx  = label_to_idx.get(top_label)
        primary_cat  = _INDEX_TO_CATEGORY.get(primary_idx, EventCategory.OTHER)

        secondary_cat = None
        if sec_label:
            sec_idx      = label_to_idx.get(sec_label)
            secondary_cat = _INDEX_TO_CATEGORY.get(sec_idx)

        keywords = _extract_keywords(text)

        return ClassificationResult(
            primary_category=primary_cat,
            secondary_category=secondary_cat,
            confidence_score=top_score,
            keywords=keywords,
        )

    except Exception as e:
        logger.error(f"BART-large-MNLI inference error: {e}")
        return ClassificationResult(
            primary_category=EventCategory.OTHER,
            confidence_score=0.5,
            keywords=_extract_keywords(text),
        )