import logging
import uuid
from typing import Optional
from datetime import datetime, timezone

from .schemas import EventInput, EventClassificationResult, InvestorPersona
from .models.sentiment import analyze_sentiment
from .models.classifier import classify_event
from .features.history_echo import run_history_echo
from .models.gemini_client import get_gemini_analysis

logger = logging.getLogger(__name__)

def setup_pipeline():
    """Initializes the ML pipeline by pre-loading singletons and checking DB."""
    from .models.embeddings import seed_from_json
    try:
        count = seed_from_json()
        logger.info(f"Database ready with {count} events.")
    except Exception as e:
        logger.error(f"Failed to seed vector database: {e}")

def run_event_pipeline(
    event: EventInput, 
    persona: Optional[InvestorPersona] = None, 
    run_history: bool = True, 
    run_gemini: bool = True
) -> EventClassificationResult:
    """
    Runs the full NLP pipeline on an arbitrary financial news event.
    """
    text = event.text
    if len(text.strip()) < 10:
        raise ValueError("Event text too short for meaningful analysis.")

    # 1. Sentiment & Zero-Shot Classification (Local Models)
    sentiment = analyze_sentiment(text)
    classification = classify_event(text)

    # 2. History Echo via Semantic Vector Search
    history = None
    if run_history:
        history = run_history_echo(
            event_text=text,
            persona=persona,
            timeframe="1w"
        )

    # 3. Gemini Generative Analysis (Domino Map & Persona Advisory)
    domino = None
    ai_summary = None
    
    if run_gemini and event.deep_analysis:
        persona_sectors = [s.value for s in persona.sectors] if persona and persona.sectors else None
        
        try:
            domino, ai_summary = get_gemini_analysis(
                text=text,
                primary_sector=classification.primary_sector,
                sentiment=sentiment.label,
                persona_sectors=persona_sectors
            )
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")

    # Calculate signal score
    signal = 0.5
    if sentiment.label.value == "positive":
        signal = 0.5 + (0.5 * sentiment.score)
    elif sentiment.label.value == "negative":
        signal = 0.5 - (0.5 * sentiment.score)

    # Calculate persona relevance
    relevance = 0.85 if persona is not None else None

    # 4. Construct response
    return EventClassificationResult(
        input_text=text,
        sentiment=sentiment,
        classification=classification,
        domino_chain=domino,
        history_echo=history,
        persona_summary=ai_summary,
        persona_relevance=relevance,
        signal_score=signal
    )
