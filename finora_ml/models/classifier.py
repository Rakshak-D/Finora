import logging
from functools import lru_cache

from transformers import pipeline

from ..config import BART_MODEL, ENABLE_GPU, EVENT_TYPES, TORCH_DEVICE, TORCH_DEVICE_INDEX, TORCH_DTYPE
from ..schemas import ClassificationResult

logger = logging.getLogger(__name__)

SECTOR_KEYWORDS = {
    "defence": {"defence", "defense", "military", "missile", "aerospace", "army", "navy"},
    "banking": {"bank", "banking", "loan", "credit", "rbi", "repo", "interest", "liquidity"},
    "it": {"it", "software", "tech", "technology", "ai", "cloud", "semiconductor", "digital"},
    "pharma": {"pharma", "drug", "healthcare", "hospital", "vaccine", "usfda", "medicine"},
    "energy": {"energy", "oil", "gas", "power", "coal", "renewable", "solar", "crude"},
    "auto": {"auto", "automobile", "vehicle", "ev", "car", "truck", "mobility"},
    "infra": {"infra", "infrastructure", "construction", "cement", "capex", "road", "rail"},
    "fmcg": {"fmcg", "consumer", "retail", "staples", "food", "beverage"},
    "metals": {"metal", "steel", "aluminium", "copper", "mining", "ore"},
    "realestate": {"real estate", "property", "housing", "realty", "mortgage"},
}

EVENT_TYPE_KEYWORDS = {
    "earnings report": {"earnings", "profit", "results", "quarter", "guidance", "revenue"},
    "geopolitical tension": {"war", "border", "strike", "geopolitical", "conflict", "tariff", "sanction"},
    "government policy": {"budget", "government", "cabinet", "ministry", "policy", "scheme"},
    "merger and acquisition": {"merger", "acquisition", "deal", "buyout", "stake sale"},
    "interest rate decision": {"rbi", "repo", "rate hike", "rate cut", "fed", "monetary policy"},
    "trade deal": {"trade", "fta", "export", "import", "agreement"},
    "natural disaster": {"earthquake", "flood", "cyclone", "wildfire", "disaster"},
    "regulatory change": {"regulator", "sebi", "approval", "ban", "compliance", "guideline"},
    "product launch": {"launch", "rollout", "debut", "release"},
    "market crash": {"crash", "selloff", "panic", "correction", "slump"},
}

_classifier_runtime = {
    "provider": "heuristic",
    "ready": False,
    "using_gpu": ENABLE_GPU,
    "device": TORCH_DEVICE,
    "error": "",
}


def get_classifier_status() -> dict:
    return dict(_classifier_runtime)

@lru_cache(maxsize=1)
def get_classifier():
    """Lazy load and cache the zero-shot classification pipeline."""
    model_kwargs = {"torch_dtype": TORCH_DTYPE} if ENABLE_GPU else {}
    try:
        classifier = pipeline(
            "zero-shot-classification",
            model=BART_MODEL,
            device=TORCH_DEVICE_INDEX,
            model_kwargs=model_kwargs,
        )
    except Exception as exc:
        _classifier_runtime.update(
            {
                "provider": "heuristic",
                "ready": False,
                "using_gpu": False,
                "error": str(exc),
            }
        )
        logger.warning("BART classifier unavailable, using heuristic fallback: %s", exc)
        return None

    _classifier_runtime.update(
        {
            "provider": BART_MODEL,
            "ready": True,
            "using_gpu": ENABLE_GPU,
            "error": "",
        }
    )
    return classifier


def _tokenise(text: str) -> str:
    return f" {text.lower()} "


def _keyword_score(text: str, keywords: set[str]) -> float:
    lowered = _tokenise(text)
    return float(sum(1 for keyword in keywords if f" {keyword.lower()} " in lowered or keyword.lower() in lowered))


def _normalise_scores(raw_scores: dict[str, float]) -> dict[str, float]:
    total = sum(raw_scores.values())
    if total <= 0:
        even_score = round(1 / max(len(raw_scores), 1), 3)
        return {key: even_score for key in raw_scores}
    return {key: round(value / total, 3) for key, value in raw_scores.items()}


def _heuristic_classify_event(text: str) -> ClassificationResult:
    sector_scores = _normalise_scores(
        {
            sector: max(0.2, _keyword_score(text, keywords))
            for sector, keywords in SECTOR_KEYWORDS.items()
        }
    )
    event_scores = _normalise_scores(
        {
            event_type: max(0.15, _keyword_score(text, keywords))
            for event_type, keywords in EVENT_TYPE_KEYWORDS.items()
        }
    )
    primary_sector = max(sector_scores, key=sector_scores.get)
    event_type = max(event_scores, key=event_scores.get)
    confidence = max(sector_scores.values()) if sector_scores else 0.4
    return ClassificationResult(
        primary_sector=primary_sector,
        event_type=event_type,
        confidence=round(max(0.35, min(0.92, confidence + 0.15)), 3),
        all_sector_scores=sector_scores,
    )


def classify_event(text: str) -> ClassificationResult:
    """Classifies a financial news event by primary sector and event type."""
    # Truncate text to avoid token limits (BART handles max 512 tokens)
    words = text.split()
    if len(words) > 400:
        text = " ".join(words[:400])

    classifier = get_classifier()
    if classifier is None:
        return _heuristic_classify_event(text)

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

    try:
        sector_res = classifier(text, candidate_labels=candidate_labels, multi_label=False)
        primary_sector_long = sector_res["labels"][0]
        primary_sector = reverse_map[primary_sector_long]

        # Map all scores back to keys
        sector_scores = {reverse_map[label]: score for label, score in zip(sector_res["labels"], sector_res["scores"])}

        event_res = classifier(text, candidate_labels=EVENT_TYPES, multi_label=False)
        event_type = event_res["labels"][0]
    except Exception as exc:
        logger.warning("BART inference failed, using heuristic fallback: %s", exc)
        return _heuristic_classify_event(text)

    return ClassificationResult(
        primary_sector=primary_sector,
        event_type=event_type,
        confidence=round(sector_res["scores"][0], 3),
        all_sector_scores=sector_scores
    )
