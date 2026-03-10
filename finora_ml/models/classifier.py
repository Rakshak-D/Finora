from transformers import pipeline
from typing import Optional

from ..config import BART_MODEL, ALL_SECTORS, EVENT_TYPES
from ..schemas import ClassificationResult

_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        _classifier = pipeline("zero-shot-classification", model=BART_MODEL)
    return _classifier


def classify_event(text: str) -> ClassificationResult:
    # Truncate text to avoid token limits (BART handles max 512 tokens)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])

    classifier = get_classifier()

    sector_res = classifier(text, candidate_labels=ALL_SECTORS, multi_label=True)
    primary_sector = sector_res["labels"][0]
    sector_scores = dict(zip(sector_res["labels"], sector_res["scores"]))

    event_res = classifier(text, candidate_labels=EVENT_TYPES, multi_label=False)
    event_type = event_res["labels"][0]

    return ClassificationResult(
        primary_sector=primary_sector,
        event_type=event_type,
        confidence=round(sector_res["scores"][0], 3),
        all_sector_scores=sector_scores
    )