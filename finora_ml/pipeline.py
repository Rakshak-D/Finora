"""
pipeline.py — Finora ML Pipeline Orchestrator.

Fixes:
  - signal_score now uses all 4 weighted components (not just sentiment)
  - avg_asset_impacts computed and attached to history_echo
  - Gemini only fires when run_gemini=True AND deep_analysis=True
  - compute_relevance_score called from investor_persona (no circular import)
"""

import logging
from typing import Optional

from .schemas import EventInput, InvestorPersona, EventClassificationResult
from .models.sentiment  import analyze_sentiment
from .models.classifier import classify_event
from .models.gemini_client import get_gemini_analysis
from .features.history_echo import run_history_echo
from .features.investor_persona import compute_relevance_score
from .config import SIGNAL_WEIGHTS, TRACKED_ASSETS

logger = logging.getLogger(__name__)


def _compute_avg_asset_impacts(history_echo) -> dict:
    """Average per-asset % changes across all historical parallels."""
    if not history_echo or not history_echo.parallels:
        return {}
    sums, counts = {}, {}
    for p in history_echo.parallels:
        for display_name, pct in p.price_changes.items():
            key = display_name.replace(" ", "_").replace("/", "_")
            sums[key]   = sums.get(key, 0.0) + pct
            counts[key] = counts.get(key, 0) + 1
    return {k: round(sums[k] / counts[k], 2) for k in sums if counts[k] > 0}


def _compute_signal_score(
    sentiment_label: str,
    sentiment_score: float,
    classification_confidence: float,
    relevance_score: float,
    history_similarity: float,
) -> float:
    """Weighted composite signal, 0.0–1.0."""
    if sentiment_label == "positive":
        sent_signal = 0.5 + 0.5 * sentiment_score
    elif sentiment_label == "negative":
        sent_signal = 0.5 - 0.5 * sentiment_score
    else:
        sent_signal = 0.5

    raw = (
        SIGNAL_WEIGHTS["sentiment"]             * sent_signal            +
        SIGNAL_WEIGHTS["historical_similarity"] * history_similarity     +
        SIGNAL_WEIGHTS["sector_relevance"]      * relevance_score        +
        SIGNAL_WEIGHTS["event_confidence"]      * classification_confidence
    )
    return round(max(0.0, min(1.0, raw)), 4)


def setup_pipeline():
    """Pre-loads all ML model singletons and seeds ChromaDB. Call once at startup."""
    from .config import FORCE_RESEED_CHROMA
    from .models.embeddings import seed_from_json, get_bge_model, get_chroma_collection
    from .models.sentiment  import get_sentiment_pipe
    from .models.classifier import get_classifier

    logger.info("Setting up Finora ML pipeline…")
    get_sentiment_pipe()
    get_classifier()
    get_bge_model()
    get_chroma_collection()

    try:
        count = seed_from_json(force=FORCE_RESEED_CHROMA)
        logger.info(f"ChromaDB ready with {count} historical events.")
    except Exception as e:
        logger.error(f"ChromaDB seed failed: {e}")

    logger.info("Pipeline setup complete.")


def run_event_pipeline(
    event:       EventInput,
    persona:     Optional[InvestorPersona] = None,
    run_history: bool = True,
    run_gemini:  bool = True,
) -> EventClassificationResult:
    """
    Full Finora ML pipeline.
    signal_score in return is always 0.0–1.0.
    history_echo.avg_asset_impacts is always populated (empty dict if no data).
    """
    text = event.text.strip()
    if len(text) < 10:
        raise ValueError("Event text too short (min 10 characters).")

    # 1. Sentiment
    sentiment = analyze_sentiment(text)

    # 2. Classification
    classification = classify_event(text)

    # 3. Relevance
    relevance_score = compute_relevance_score(persona, classification) if persona else 0.5

    # 4. History Echo
    history_echo       = None
    history_similarity = 0.5

    if run_history:
        try:
            history_echo = run_history_echo(event_text=text, persona=persona, timeframe="1w")
            history_echo.avg_asset_impacts = _compute_avg_asset_impacts(history_echo)
            if history_echo.parallels:
                history_similarity = history_echo.parallels[0].similarity_score
        except Exception as e:
            logger.error(f"History echo failed: {e}")

    # 5. Gemini
    domino_chain    = None
    persona_summary = None

    if run_gemini and event.deep_analysis:
        persona_sectors = [s.value for s in persona.sectors] if persona else None
        try:
            domino_chain, persona_summary = get_gemini_analysis(
                text=text,
                primary_sector=classification.primary_sector,
                sentiment=sentiment.label.value,
                persona_sectors=persona_sectors,
            )
        except Exception as e:
            logger.error(f"Gemini failed: {e}")

    # 6. Signal score
    signal_score = _compute_signal_score(
        sentiment_label=sentiment.label.value,
        sentiment_score=sentiment.score,
        classification_confidence=classification.confidence,
        relevance_score=relevance_score,
        history_similarity=history_similarity,
    )

    return EventClassificationResult(
        input_text=text,
        sentiment=sentiment,
        classification=classification,
        domino_chain=domino_chain,
        history_echo=history_echo,
        gemini_analysis=None,
        persona_relevance=relevance_score if persona else None,
        persona_summary=persona_summary,
        signal_score=signal_score,
    )