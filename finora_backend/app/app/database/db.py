"""
database/db.py

ChromaDB — stores every analyzed headline as a vector document.

Why ChromaDB for Finora:
  - Each headline is stored with its embedding so you can later do
    semantic similarity search ("find headlines similar to this one")
  - Metadata (sentiment, category, impact, source) is stored alongside
    and can be filtered directly in queries
  - No SQL, no schema migrations — just add and query documents

Collection: "headlines"
"""

import json
import logging
import chromadb
from chromadb.config import Settings

logger = logging.getLogger("finora.db")

# ── Client setup ───────────────────────────────────────────────────────────────
# persist_directory: ChromaDB saves data here on disk between restarts.

_client: chromadb.ClientAPI = None
_collection = None

PERSIST_DIR  = "./chroma_db"
COLLECTION   = "headlines"


def init_db() -> None:
    """
    Initialize ChromaDB client and get/create the headlines collection.
    Called once on app startup from main.py.
    """
    global _client, _collection

    _client = chromadb.PersistentClient(
        path=PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )

    _collection = _client.get_or_create_collection(
        name=COLLECTION,
        metadata={"hnsw:space": "cosine"},   # cosine similarity for text embeddings
    )

    logger.info(f"ChromaDB ready → {PERSIST_DIR}  |  collection: '{COLLECTION}'")


def _get_collection():
    if _collection is None:
        raise RuntimeError("DB not initialised. Call init_db() on startup.")
    return _collection


# ── Write ──────────────────────────────────────────────────────────────────────

def save_headline(data: dict) -> None:
    """
    Store one analyzed headline in ChromaDB.

    ChromaDB structure:
      ids       → unique document ID
      documents → the raw headline text (used for embedding + display)
      metadatas → flat key-value dict (sentiment, category, scores, source...)

    Note: ChromaDB metadata values must be str | int | float | bool.
    Nested dicts are JSON-stringified before storing.
    """
    col = _get_collection()

    metadata = {
        # Source info
        "source_url"          : data.get("source_url") or "",
        "source_name"         : data.get("source_name") or "",
        "scraped_at"          : str(data.get("scraped_at") or ""),
        "processed_at"        : str(data["processed_at"]),

        # Sentiment (flat)
        "sentiment_label"     : data["sentiment"]["label"],
        "sentiment_score"     : float(data["sentiment"]["score"]),
        "sentiment_positive"  : float(data["sentiment"]["positive_score"]),
        "sentiment_negative"  : float(data["sentiment"]["negative_score"]),
        "sentiment_neutral"   : float(data["sentiment"]["neutral_score"]),

        # Classification (flat)
        "primary_category"    : data["classification"]["primary_category"],
        "secondary_category"  : data["classification"].get("secondary_category") or "",
        "confidence_score"    : float(data["classification"]["confidence_score"]),
        "keywords"            : json.dumps(data["classification"].get("keywords", [])),

        # Impact (flat)
        "impact_level"        : data["impact"]["impact_level"],
        "impact_score"        : float(data["impact"]["impact_score"]),
        "affected_sectors"    : json.dumps(data["impact"]["affected_sectors"]),
        "affected_companies"  : json.dumps(data["impact"]["affected_companies"]),
        "affected_indices"    : json.dumps(data["impact"]["affected_indices"]),
        "rationale"           : data["impact"]["rationale"],
    }

    col.add(
        ids       = [data["id"]],
        documents = [data["headline"]],
        metadatas = [metadata],
    )

    logger.info(f"Saved headline [{data['id'][:8]}...] → '{data['headline'][:60]}'")


# ── Read ───────────────────────────────────────────────────────────────────────

def _chroma_to_dict(id: str, document: str, metadata: dict) -> dict:
    """
    Reconstruct the full AnalyzedHeadline-shaped dict from
    ChromaDB's flat metadata + document fields.
    """
    return {
        "id"         : id,
        "headline"   : document,
        "source_url" : metadata.get("source_url") or None,
        "source_name": metadata.get("source_name") or None,
        "scraped_at" : metadata.get("scraped_at") or None,
        "processed_at": metadata.get("processed_at"),

        "sentiment": {
            "label"          : metadata["sentiment_label"],
            "score"          : metadata["sentiment_score"],
            "positive_score" : metadata["sentiment_positive"],
            "negative_score" : metadata["sentiment_negative"],
            "neutral_score"  : metadata["sentiment_neutral"],
        },

        "classification": {
            "primary_category"  : metadata["primary_category"],
            "secondary_category": metadata.get("secondary_category") or None,
            "confidence_score"  : metadata["confidence_score"],
            "keywords"          : json.loads(metadata.get("keywords", "[]")),
        },

        "impact": {
            "impact_level"      : metadata["impact_level"],
            "impact_score"      : metadata["impact_score"],
            "affected_sectors"  : json.loads(metadata.get("affected_sectors", "[]")),
            "affected_companies": json.loads(metadata.get("affected_companies", "[]")),
            "affected_indices"  : json.loads(metadata.get("affected_indices", "[]")),
            "rationale"         : metadata.get("rationale", ""),
        },
    }


def get_feed(limit: int = 50) -> list[dict]:
    """
    Return the latest analyzed headlines, newest first.
    ChromaDB doesn't have native ORDER BY, so we fetch all
    and sort by processed_at in Python.
    """
    col    = _get_collection()
    count  = col.count()

    if count == 0:
        return []

    # Fetch up to limit*3 to have room after Python-side sorting
    fetch_n = min(count, limit * 3)

    results = col.get(
        limit     = fetch_n,
        include   = ["documents", "metadatas"],
    )

    rows = [
        _chroma_to_dict(id_, doc, meta)
        for id_, doc, meta in zip(
            results["ids"],
            results["documents"],
            results["metadatas"],
        )
    ]

    # Sort newest first, return top N
    rows.sort(key=lambda x: x["processed_at"] or "", reverse=True)
    return rows[:limit]


def get_headline_by_id(headline_id: str) -> dict | None:
    """Fetch a single headline by its ID."""
    col = _get_collection()

    results = col.get(
        ids     = [headline_id],
        include = ["documents", "metadatas"],
    )

    if not results["ids"]:
        return None

    return _chroma_to_dict(
        results["ids"][0],
        results["documents"][0],
        results["metadatas"][0],
    )


def search_similar(query: str, n_results: int = 10) -> list[dict]:
    """
    Semantic similarity search — find headlines similar to the query text.
    ChromaDB handles the embedding internally using its default model.

    This is the bonus feature SQLite couldn't give you:
    e.g. search_similar("oil price crash") returns semantically
    related headlines even if they don't share the exact words.
    """
    col = _get_collection()

    if col.count() == 0:
        return []

    results = col.query(
        query_texts = [query],
        n_results   = min(n_results, col.count()),
        include     = ["documents", "metadatas", "distances"],
    )

    return [
        {
            **_chroma_to_dict(id_, doc, meta),
            "similarity_score": round(1 - dist, 4),   # cosine distance → similarity
        }
        for id_, doc, meta, dist in zip(
            results["ids"][0],
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        )
    ]