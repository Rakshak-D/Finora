from transformers import pipeline
from typing import Optional

from functools import lru_cache

from ..config import BART_MODEL, ALL_SECTORS, EVENT_TYPES
from ..schemas import ClassificationResult

@lru_cache(maxsize=1)
def get_classifier():
    """Lazy load and cache the zero-shot classification pipeline."""
    return pipeline("zero-shot-classification", model=BART_MODEL)


def classify_event(text: str) -> ClassificationResult:
    """Classifies a financial news event by primary sector and event type."""
    # Truncate text to avoid token limits (BART handles max 512 tokens)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])

    classifier = get_classifier()

    # Map labels to more descriptive versions for better zero-shot performance
    label_map = {
        "defence": "defense and aerospace",
        "banking": "banking and finance",
        "it": "Information Technology (IT) and software",
        "pharma": "pharmaceuticals and healthcare",
        "energy": "energy, oil and gas",
        "auto": "automotive and vehicles",
        "infra": "infrastructure and construction",
        "fmcg": "Consumer Goods (FMCG)",
        "metals": "metals and mining",
        "realestate": "real estate and property"
    }
    
    reverse_map = {v: k for k, v in label_map.items()}
    candidate_labels = list(label_map.values())

    sector_res = classifier(text, candidate_labels=candidate_labels, multi_label=False)
    primary_sector_long = sector_res["labels"][0]
    primary_sector = reverse_map[primary_sector_long]
    
    # Map all scores back to keys
    sector_scores = {reverse_map[l]: s for l, s in zip(sector_res["labels"], sector_res["scores"])}

    event_res = classifier(text, candidate_labels=EVENT_TYPES, multi_label=False)
    event_type = event_res["labels"][0]

    return ClassificationResult(
        primary_sector=primary_sector,
        event_type=event_type,
        confidence=round(sector_res["scores"][0], 3),
        all_sector_scores=sector_scores
    )