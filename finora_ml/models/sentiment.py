import logging
from functools import lru_cache

from transformers import pipeline

from ..config import ENABLE_GPU, FINBERT_MODEL, TORCH_DEVICE, TORCH_DEVICE_INDEX, TORCH_DTYPE
from ..schemas import Sentiment, SentimentResult

logger = logging.getLogger(__name__)

POSITIVE_HINTS = {
    "surge",
    "beat",
    "gain",
    "gains",
    "rally",
    "approval",
    "expand",
    "growth",
    "record",
    "bullish",
    "upgrade",
    "profit",
    "wins",
}

NEGATIVE_HINTS = {
    "crash",
    "selloff",
    "war",
    "fraud",
    "downgrade",
    "loss",
    "losses",
    "default",
    "fall",
    "falls",
    "bearish",
    "decline",
    "cut",
    "layoffs",
}

_sentiment_runtime = {
    "provider": "heuristic",
    "ready": False,
    "using_gpu": ENABLE_GPU,
    "device": TORCH_DEVICE,
    "error": "",
}


def get_sentiment_status() -> dict:
    return dict(_sentiment_runtime)

@lru_cache(maxsize=1)
def get_sentiment_pipe():
    """Lazy load and cache the FinBERT sentiment analysis pipeline."""
    model_kwargs = {"torch_dtype": TORCH_DTYPE} if ENABLE_GPU else {}
    try:
        sentiment_pipe = pipeline(
            "text-classification",
            model=FINBERT_MODEL,
            return_all_scores=True,
            device=TORCH_DEVICE_INDEX,
            model_kwargs=model_kwargs,
        )
    except Exception as exc:
        _sentiment_runtime.update(
            {
                "provider": "heuristic",
                "ready": False,
                "using_gpu": False,
                "error": str(exc),
            }
        )
        logger.warning("FinBERT unavailable, using heuristic sentiment fallback: %s", exc)
        return None

    _sentiment_runtime.update(
        {
            "provider": FINBERT_MODEL,
            "ready": True,
            "using_gpu": ENABLE_GPU,
            "error": "",
        }
    )
    return sentiment_pipe


def _heuristic_sentiment(text: str) -> SentimentResult:
    tokens = [token.strip(".,:;!?()[]{}'\"").lower() for token in text.split()]
    positive_hits = sum(1 for token in tokens if token in POSITIVE_HINTS)
    negative_hits = sum(1 for token in tokens if token in NEGATIVE_HINTS)

    if positive_hits > negative_hits:
        confidence = min(0.9, 0.52 + 0.08 * (positive_hits - negative_hits))
        return SentimentResult(label=Sentiment.POSITIVE, score=round(confidence, 3), raw_label="heuristic_positive")
    if negative_hits > positive_hits:
        confidence = min(0.9, 0.52 + 0.08 * (negative_hits - positive_hits))
        return SentimentResult(label=Sentiment.NEGATIVE, score=round(confidence, 3), raw_label="heuristic_negative")
    return SentimentResult(label=Sentiment.NEUTRAL, score=0.5, raw_label="heuristic_neutral")


def analyze_sentiment(text: str) -> SentimentResult:
    """Analyzes financial sentiment using FinBERT, capping text length to avoid token limits."""
    # Truncate text to avoid token limits (FinBERT handles max 512 tokens)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])

    pipe = get_sentiment_pipe()
    if pipe is None:
        return _heuristic_sentiment(text)

    try:
        raw_results = pipe(text)
    except Exception as exc:
        logger.warning("FinBERT inference failed, using heuristic fallback: %s", exc)
        return _heuristic_sentiment(text)
    
    # Handle variations in HuggingFace pipeline return formats
    # Sometimes it returns `[{"label": "...", "score": ...}]` 
    # and sometimes `[[{"label": "...", "score": ...}, ...]]`
    results = raw_results[0] if isinstance(raw_results[0], list) else raw_results
    
    top = max(results, key=lambda x: x["score"])
    label = top["label"].lower()
    score = top["score"]

    sentiment_map = {"positive": Sentiment.POSITIVE, "negative": Sentiment.NEGATIVE, "neutral": Sentiment.NEUTRAL}
    return SentimentResult(
        label=sentiment_map.get(label, Sentiment.NEUTRAL),
        score=round(score, 3),
        raw_label=label
    )
