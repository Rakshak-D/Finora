import logging

from .schemas import (
    EventInput, InvestorPersona, EventClassificationResult,
    SentimentResult, ClassificationResult
)
from .models.sentiment import analyze_sentiment
from .models.classifier import classify_event
from .models.gemini_client import get_domino_chain, get_persona_summary
from .features.investor_persona import compute_relevance_score, get_portfolio_value
from .features.history_echo import run_history_echo
from .models.embeddings import seed_from_json
from .config import SIGNAL_WEIGHTS

logger = logging.getLogger(__name__)

def setup_pipeline():
    logger.info("Seeding vector database...")
    count = seed_from_json()
    logger.info(f"Database seeded with {count} events.")



def sentiment_to_signal(sent: SentimentResult) -> float:
    if sent.label == "positive":
        return sent.score
    if sent.label == "negative":
        return 1 - sent.score
    return 0.5


def run_event_pipeline(
    event: EventInput,
    persona: InvestorPersona | None = None,
    run_history: bool = True,
    run_gemini: bool = False   # set False for hackathon speed
) -> EventClassificationResult:
    text = event.text.strip()

    sentiment = analyze_sentiment(text)

    classification = classify_event(text)

    relevance = 0.5
    if persona:
        relevance = compute_relevance_score(persona, classification)

    history_result = None
    hist_sim = 0.5
    if run_history:
        try:
            history_result = run_history_echo(text, persona)
            if history_result.parallels:
                hist_sim = max(p.similarity_score for p in history_result.parallels)
        except Exception as e:
            logger.warning(f"History echo failed: {e}")

    domino = None
    persona_sum = None
    if run_gemini:
        sectors = [s.value for s in persona.sectors] if persona else None
        domino = get_domino_chain(text, classification.primary_sector, sentiment.label.value, sectors)
        if persona:
            val = get_portfolio_value(persona)
            persona_sum = get_persona_summary(text, sectors)

    signal = round(
        SIGNAL_WEIGHTS["sentiment"] * sentiment_to_signal(sentiment) +
        SIGNAL_WEIGHTS["historical_similarity"] * hist_sim +
        SIGNAL_WEIGHTS["sector_relevance"] * relevance +
        SIGNAL_WEIGHTS["event_confidence"] * classification.confidence,
        2
    ) * 100

    return EventClassificationResult(
        input_text=text,
        sentiment=sentiment,
        classification=classification,
        domino_chain=domino,
        history_echo=history_result,
        persona_relevance=relevance,
        persona_summary=persona_sum,
        signal_score=signal
    )