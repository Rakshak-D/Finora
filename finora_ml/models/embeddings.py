"""
models/embeddings.py — BGE embeddings + ChromaDB vector store.

Function name fixes vs previous version:
  - get_bge()       → get_bge_model()     (pipeline.py was calling get_bge_model)
  - get_collection() → get_chroma_collection()  (pipeline.py was calling get_chroma_collection)
Both old names kept as aliases so any existing callers still work.
"""

import json
import logging
import os
import uuid
from functools import lru_cache
from typing import Optional

import chromadb
from sentence_transformers import SentenceTransformer

from ..config import (
    BGE_MODEL, CHROMA_PERSIST_DIR, CHROMA_COLLECTION_NAME,
    HISTORY_TOP_K, FORCE_RESEED_CHROMA,
)

logger = logging.getLogger(__name__)

BASE_DIR          = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_JSON_PATH = os.path.join(BASE_DIR, "historical_events.json")

_chroma_client = None


@lru_cache(maxsize=1)
def get_bge_model() -> SentenceTransformer:
    """Lazy-load and cache the BGE SentenceTransformer."""
    logger.info(f"Loading SentenceTransformer: {BGE_MODEL}")
    return SentenceTransformer(BGE_MODEL)


# Alias for backward compatibility
get_bge = get_bge_model


def get_chroma_collection():
    """Get-or-create the ChromaDB collection singleton."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _chroma_client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


# Alias for backward compatibility
get_collection = get_chroma_collection


def embed_text(text: str) -> list:
    """Embed text with the BGE instruction prefix."""
    return get_bge_model().encode(
        "Represent this financial news: " + text,
        normalize_embeddings=True,
    ).tolist()


def _pct_to_float(v) -> float:
    """Convert a percentage value (string or numeric) to float."""
    if v is None:
        return 0.0
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v.strip().replace("%", "").strip())
        except ValueError:
            return 0.0
    return 0.0


def seed_from_json(json_path: str = DEFAULT_JSON_PATH, force: bool = False) -> int:
    """
    Seed ChromaDB with events from historical_events.json.

    Flattens asset_impacts into metadata keys like:
      Nifty_50_1d, Nifty_50_1w, Nifty_50_1m, Bank_Nifty_1d, ...

    These keys are read back by get_asset_impact_from_metadata().

    force=True or env FORCE_RESEED_CHROMA=1 clears and rebuilds the collection.
    """
    global _chroma_client
    force = force or FORCE_RESEED_CHROMA

    if force and _chroma_client is not None:
        try:
            _chroma_client.delete_collection(CHROMA_COLLECTION_NAME)
            logger.info("Deleted existing ChromaDB collection for re-seed.")
        except Exception as e:
            logger.warning(f"Could not delete collection: {e}")
        _chroma_client = None

    collection = get_chroma_collection()

    if collection.count() > 0 and not force:
        logger.info(f"ChromaDB already has {collection.count()} events. Skipping seed.")
        return collection.count()

    if not os.path.exists(json_path):
        logger.error(f"historical_events.json not found at {json_path}")
        return 0

    with open(json_path, encoding="utf-8") as f:
        events = json.load(f)

    ids, embeddings, metadatas, documents = [], [], [], []

    for ev in events:
        # Use search_text if present, otherwise compose from headline + description
        text = ev.get("search_text") or (
            ev.get("event", "") + " " + ev.get("description", "")
        ).strip()
        if not text:
            continue

        emb = embed_text(text)

        meta: dict = {
            "primary_sector": ev.get("primary_sector", "unknown"),
            "date":           ev.get("date", ev.get("date_approx", "")),
            "event_type":     ev.get("event_type", ""),
        }

        # Flatten asset_impacts → Nifty_50_1d, Nifty_50_1w, Nifty_50_1m …
        for asset, impact_data in ev.get("asset_impacts", {}).items():
            for tf in ("1d", "1w", "1m"):
                val = impact_data.get(tf) or impact_data.get(f"est_pct_{tf}")
                meta[f"{asset}_{tf}"] = _pct_to_float(val)

        ids.append(str(uuid.uuid4()))
        embeddings.append(emb)
        metadatas.append(meta)
        documents.append(text[:500])

    if ids:
        collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
        logger.info(f"Seeded ChromaDB with {len(ids)} events.")

    return len(ids)


def retrieve_similar_events(
    text:          str,
    top_k:         int = HISTORY_TOP_K,
    sector_filter: Optional[str] = None,
) -> list:
    """
    Query ChromaDB for the top-k semantically similar historical events.

    Returns list of dicts:
      { "text": str, "metadata": dict, "similarity_score": float }
    """
    collection = get_chroma_collection()
    if collection.count() == 0:
        return []

    emb   = embed_text(text)
    where = {"primary_sector": sector_filter} if sector_filter else None

    res = collection.query(
        query_embeddings=[emb],
        n_results=min(top_k, collection.count()),
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    return [
        {
            "text":             res["documents"][0][i],
            "metadata":         res["metadatas"][0][i],
            "similarity_score": round(1.0 - res["distances"][0][i], 3),
        }
        for i in range(len(res["ids"][0]))
    ]


def get_asset_impact_from_metadata(meta: dict, asset: str = "Nifty_50", timeframe: str = "1w") -> float:
    """Read a pre-computed asset impact from ChromaDB metadata."""
    return float(meta.get(f"{asset}_{timeframe}", 0.0))