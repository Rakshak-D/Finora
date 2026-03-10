import logging
from functools import lru_cache
from app.models.schemas import SentimentResult, SentimentLabel

logger = logging.getLogger("finora.sentiment")

@lru_cache(maxsize=1)
def _get_pipeline():
    """Load FinBERT pipeline once and cache it for the lifetime of the process."""
    try:
        from transformers import pipeline
        logger.info("Loading FinBERT (ProsusAI/finbert)... may take a moment on first run.")
        pipe = pipeline(
            task="text-classification",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
            top_k=None,          # return all three label scores
            truncation=True,
            max_length=512,
        )
        logger.info("FinBERT loaded successfully.")
        return pipe
    except Exception as e:
        logger.error(f"Failed to load FinBERT: {e}")
        return None

_LABEL_MAP = {
    "positive": SentimentLabel.POSITIVE,
    "negative": SentimentLabel.NEGATIVE,
    "neutral" : SentimentLabel.NEUTRAL,
}

def analyze_sentiment(text: str) -> SentimentResult:
    """
    Run FinBERT sentiment analysis on financial news text.

    Returns:
        SentimentResult with label, confidence score, and per-class scores.

    Falls back to neutral (score=1.0) if the model is unavailable or
    the input is empty.
    """
    if not text or not text.strip():
        return SentimentResult(
            label=SentimentLabel.NEUTRAL, score=1.0,
            positive_score=0.0, negative_score=0.0, neutral_score=1.0,
        )

    pipe = _get_pipeline()

    if pipe is None:
        logger.warning("FinBERT unavailable — returning neutral fallback.")
        return SentimentResult(
            label=SentimentLabel.NEUTRAL, score=1.0,
            positive_score=0.0, negative_score=0.0, neutral_score=1.0,
        )

    try:
        # pipeline returns [[{label, score}, ...]] when top_k=None
        results: list[dict] = pipe(text)[0]

        # Build a {label: score} lookup
        scores = {r["label"].lower(): round(r["score"], 4) for r in results}

        pos = scores.get("positive", 0.0)
        neg = scores.get("negative", 0.0)
        neu = scores.get("neutral",  0.0)

        # The winning label is the one with the highest score
        best       = max(results, key=lambda r: r["score"])
        raw_label  = best["label"].lower()
        label      = _LABEL_MAP.get(raw_label, SentimentLabel.NEUTRAL)
        confidence = round(best["score"], 4)

        return SentimentResult(
            label=label,
            score=confidence,
            positive_score=pos,
            negative_score=neg,
            neutral_score=neu,
        )

    except Exception as e:
        logger.error(f"FinBERT inference error: {e}")
        return SentimentResult(
            label=SentimentLabel.NEUTRAL, score=1.0,
            positive_score=0.0, negative_score=0.0, neutral_score=1.0,
        )