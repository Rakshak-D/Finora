from transformers import pipeline
from ..config import FINBERT_MODEL
from ..schemas import SentimentResult, Sentiment

_pipe = None

def get_sentiment_pipe():
    global _pipe
    if _pipe is None:
        _pipe = pipeline("text-classification", model=FINBERT_MODEL, return_all_scores=True)
    return _pipe


def analyze_sentiment(text: str) -> SentimentResult:
    # Truncate text to avoid token limits (FinBERT handles max 512 tokens)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])

    pipe = get_sentiment_pipe()
    raw_results = pipe(text)
    
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