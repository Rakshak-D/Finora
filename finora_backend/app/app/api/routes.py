"""
api/routes.py

3 endpoints:
  POST  /api/scrape          <- Chrome extension sends scraped headline
  GET   /api/feed            <- Frontend polls for latest analyzed headlines
  GET   /api/feed/{id}       <- Frontend fetches single result by ID

Bonus:
  GET   /api/search?q=...    <- Semantic similarity search (ChromaDB feature)
"""

import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas             import ScrapeRequest, AnalyzedHeadline, ClassificationResult
from app.services.sentiment_analysis import analyze_sentiment
from app.services.model_client      import get_classification
from app.services.impact_map    import map_impact
from app.database.db                import save_headline, get_feed, get_headline_by_id, search_similar

logger = logging.getLogger("finora.routes")
router = APIRouter(prefix="/api")

@router.post("/scrape", response_model=AnalyzedHeadline, tags=["Scrape"])
async def scrape(req: ScrapeRequest):
    """
    Receives scraped headline from Chrome extension.
    Runs sentiment → calls teammate's classifier → maps impact → saves to ChromaDB.
    """
    if not req.headline.strip():
        raise HTTPException(status_code=422, detail="Headline cannot be empty.")

    # Step 1 — sentiment (your FinBERT service)
    sentiment = analyze_sentiment(req.headline)

    # Step 2 — classification (teammate's model)
    model_result = await get_classification(req.headline)

    # Step 3 — map to ClassificationResult
    classification = ClassificationResult(
        primary_category   = model_result.primary_category,
        secondary_category = model_result.secondary_category,
        confidence_score   = model_result.confidence_score,
        keywords           = model_result.keywords or [],
    )

    # Step 4 — impact
    impact = map_impact(req.headline, sentiment, classification)

    # Step 5 — assemble
    result = AnalyzedHeadline(
        id             = str(uuid.uuid4()),
        headline       = req.headline,
        source_url     = req.source_url,
        source_name    = req.source_name,
        scraped_at     = req.scraped_at or datetime.now(timezone.utc),
        processed_at   = datetime.now(timezone.utc),
        sentiment      = sentiment,
        classification = classification,
        impact         = impact,
    )

    # Step 6 — save to ChromaDB
    save_headline(result.model_dump(mode="json"))

    return result

@router.get("/feed", response_model=list[AnalyzedHeadline], tags=["Feed"])
def feed(limit: int = Query(50, ge=1, le=200)):
    """
    Returns latest analyzed headlines, newest first.
    Frontend polls this to refresh the dashboard.
    """
    return get_feed(limit=limit)


@router.get("/feed/{headline_id}", response_model=AnalyzedHeadline, tags=["Feed"])
def feed_item(headline_id: str):
    """Returns a single analyzed headline by ID."""
    row = get_headline_by_id(headline_id)
    if not row:
        raise HTTPException(status_code=404, detail=f"Headline '{headline_id}' not found.")
    return row



@router.get("/search", tags=["Search"])
def search(q: str = Query(..., description="Search query"), n: int = Query(10, ge=1, le=50)):
    """
    Semantic similarity search powered by ChromaDB.
    Finds headlines semantically similar to the query —
    even if they don't share the exact same words.

    Example: GET /api/search?q=oil price crash
    Returns headlines about energy, OPEC, commodity selloff etc.
    """
    return search_similar(query=q, n_results=n)