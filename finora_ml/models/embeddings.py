"""
models/embeddings.py — BGE embeddings + ChromaDB vector store with graceful fallbacks.
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from functools import lru_cache
from typing import Optional

try:
    import chromadb
except Exception:  # pragma: no cover - import fallback
    chromadb = None

try:
    from sentence_transformers import SentenceTransformer
except Exception:  # pragma: no cover - import fallback
    SentenceTransformer = None

from ..config import (
    BGE_MODEL,
    CHROMA_COLLECTION_NAME,
    CHROMA_PERSIST_DIR,
    FORCE_RESEED_CHROMA,
    HISTORY_TOP_K,
    TORCH_DEVICE,
)

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_JSON_PATH = os.path.join(BASE_DIR, "historical_events.json")

_chroma_client = None
_embedding_runtime = {
    "provider": "lexical",
    "ready": False,
    "using_gpu": TORCH_DEVICE.startswith("cuda"),
    "error": "",
}
_vector_runtime = {
    "provider": "lexical",
    "ready": False,
    "error": "",
}


def get_embedding_status() -> dict:
    return dict(_embedding_runtime)


def get_vector_store_status() -> dict:
    return dict(_vector_runtime)


def _load_events(json_path: str = DEFAULT_JSON_PATH) -> list[dict]:
    if not os.path.exists(json_path):
        return []
    with open(json_path, encoding="utf-8") as handle:
        return json.load(handle)


def _event_document(event: dict) -> str:
    return (
        event.get("search_text")
        or f"{event.get('event', '')} {event.get('description', '')}".strip()
        or event.get("reasoning", "")
    ).strip()


def _event_metadata(event: dict) -> dict:
    metadata: dict[str, object] = {
        "primary_sector": event.get("primary_sector", "unknown"),
        "date": event.get("date", event.get("date_approx", "")),
        "event_type": event.get("event_type", ""),
    }
    for asset, impact_data in event.get("asset_impacts", {}).items():
        if not isinstance(impact_data, dict):
            continue
        for timeframe in ("1d", "1w", "1m"):
            value = impact_data.get(timeframe) or impact_data.get(f"est_pct_{timeframe}")
            metadata[f"{asset}_{timeframe}"] = _pct_to_float(value)
    return metadata


def _tokenize(text: str) -> set[str]:
    cleaned = "".join(ch.lower() if ch.isalnum() else " " for ch in text)
    return {token for token in cleaned.split() if len(token) > 2}


def _lexical_similarity(query: str, document: str, metadata: dict, sector_filter: Optional[str]) -> float:
    query_tokens = _tokenize(query)
    document_tokens = _tokenize(document)
    if not query_tokens or not document_tokens:
        return 0.0

    overlap = len(query_tokens & document_tokens)
    union = len(query_tokens | document_tokens)
    jaccard = overlap / union if union else 0.0
    containment = overlap / max(len(query_tokens), 1)
    sector_bonus = 0.12 if sector_filter and metadata.get("primary_sector") == sector_filter else 0.0
    return round(min(0.99, 0.55 * jaccard + 0.45 * containment + sector_bonus), 3)


@lru_cache(maxsize=1)
def get_bge_model() -> Optional[SentenceTransformer]:
    """Lazy-load and cache the BGE SentenceTransformer."""
    if SentenceTransformer is None:
        _embedding_runtime.update(
            {
                "provider": "lexical",
                "ready": False,
                "error": "sentence-transformers is unavailable",
            }
        )
        return None

    logger.info("Loading SentenceTransformer: %s", BGE_MODEL)
    try:
        model = SentenceTransformer(BGE_MODEL, device=TORCH_DEVICE)
    except Exception as exc:
        _embedding_runtime.update(
            {
                "provider": "lexical",
                "ready": False,
                "error": str(exc),
            }
        )
        logger.warning("SentenceTransformer unavailable, using lexical history fallback: %s", exc)
        return None

    _embedding_runtime.update(
        {
            "provider": BGE_MODEL,
            "ready": True,
            "using_gpu": TORCH_DEVICE.startswith("cuda"),
            "error": "",
        }
    )
    return model


# Alias for backward compatibility
get_bge = get_bge_model


def get_chroma_collection():
    """Get-or-create the ChromaDB collection singleton."""
    global _chroma_client
    if chromadb is None:
        _vector_runtime.update(
            {
                "provider": "lexical",
                "ready": False,
                "error": "chromadb is unavailable",
            }
        )
        return None

    if _chroma_client is None:
        try:
            _chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        except Exception as exc:
            _vector_runtime.update(
                {
                    "provider": "lexical",
                    "ready": False,
                    "error": str(exc),
                }
            )
            logger.warning("ChromaDB unavailable, using lexical history fallback: %s", exc)
            return None

    try:
        collection = _chroma_client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    except Exception as exc:
        _vector_runtime.update(
            {
                "provider": "lexical",
                "ready": False,
                "error": str(exc),
            }
        )
        logger.warning("ChromaDB collection unavailable, using lexical history fallback: %s", exc)
        return None

    _vector_runtime.update(
        {
            "provider": CHROMA_COLLECTION_NAME,
            "ready": True,
            "error": "",
        }
    )
    return collection


# Alias for backward compatibility
get_collection = get_chroma_collection


def embed_text(text: str) -> list[float]:
    """Embed text with the BGE instruction prefix when available."""
    model = get_bge_model()
    if model is None:
        return []
    return model.encode(
        "Represent this financial news: " + text,
        normalize_embeddings=True,
    ).tolist()


def _pct_to_float(value) -> float:
    """Convert a percentage value (string or numeric) to float."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip().replace("%", "").strip())
        except ValueError:
            return 0.0
    return 0.0


def seed_from_json(json_path: str = DEFAULT_JSON_PATH, force: bool = False) -> int:
    """
    Seed ChromaDB with events from historical_events.json when vector search is available.
    """
    global _chroma_client
    force = force or FORCE_RESEED_CHROMA

    events = _load_events(json_path)
    collection = get_chroma_collection()
    model = get_bge_model()

    if collection is None or model is None:
        logger.info("Vector store warmup skipped; lexical history fallback will serve %s local events.", len(events))
        return len(events)

    if force and _chroma_client is not None:
        try:
            _chroma_client.delete_collection(CHROMA_COLLECTION_NAME)
            logger.info("Deleted existing ChromaDB collection for re-seed.")
        except Exception as exc:
            logger.warning("Could not delete collection: %s", exc)
        _chroma_client = None
        collection = get_chroma_collection()
        if collection is None:
            return len(events)

    if collection.count() > 0 and not force:
        logger.info("ChromaDB already has %s events. Skipping seed.", collection.count())
        return collection.count()

    ids: list[str] = []
    embeddings: list[list[float]] = []
    metadatas: list[dict] = []
    documents: list[str] = []

    for event in events:
        text = _event_document(event)
        if not text:
            continue

        embedding = embed_text(text)
        if not embedding:
            logger.info("Falling back to lexical history search because embeddings are unavailable.")
            return len(events)

        ids.append(str(uuid.uuid4()))
        embeddings.append(embedding)
        metadatas.append(_event_metadata(event))
        documents.append(text[:500])

    if ids:
        collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
        logger.info("Seeded ChromaDB with %s events.", len(ids))

    return len(ids)


def _retrieve_similar_events_lexical(
    text: str,
    top_k: int = HISTORY_TOP_K,
    sector_filter: Optional[str] = None,
) -> list[dict]:
    scored: list[dict] = []
    for event in _load_events():
        document = _event_document(event)
        if not document:
            continue
        metadata = _event_metadata(event)
        if sector_filter and metadata.get("primary_sector") != sector_filter:
            continue
        similarity = _lexical_similarity(text, document, metadata, sector_filter)
        if similarity <= 0:
            continue
        scored.append(
            {
                "text": document[:500],
                "metadata": metadata,
                "similarity_score": similarity,
            }
        )

    scored.sort(key=lambda item: item["similarity_score"], reverse=True)
    return scored[:top_k]


def retrieve_similar_events(
    text: str,
    top_k: int = HISTORY_TOP_K,
    sector_filter: Optional[str] = None,
) -> list[dict]:
    """
    Query ChromaDB for the top-k semantically similar historical events.
    Falls back to lexical matching when vector search is unavailable.
    """
    collection = get_chroma_collection()
    embedding = embed_text(text)

    if collection is None or not embedding:
        return _retrieve_similar_events_lexical(text=text, top_k=top_k, sector_filter=sector_filter)

    if collection.count() == 0:
        return _retrieve_similar_events_lexical(text=text, top_k=top_k, sector_filter=sector_filter)

    where = {"primary_sector": sector_filter} if sector_filter else None

    try:
        result = collection.query(
            query_embeddings=[embedding],
            n_results=min(top_k, collection.count()),
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except Exception as exc:
        logger.warning("Vector history query failed, using lexical fallback: %s", exc)
        return _retrieve_similar_events_lexical(text=text, top_k=top_k, sector_filter=sector_filter)

    return [
        {
            "text": result["documents"][0][index],
            "metadata": result["metadatas"][0][index],
            "similarity_score": round(1.0 - result["distances"][0][index], 3),
        }
        for index in range(len(result["ids"][0]))
    ]


def get_asset_impact_from_metadata(meta: dict, asset: str = "Nifty_50", timeframe: str = "1w") -> float:
    """Read a pre-computed asset impact from ChromaDB metadata."""
    return float(meta.get(f"{asset}_{timeframe}", 0.0))
