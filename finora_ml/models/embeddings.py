from sentence_transformers import SentenceTransformer
import chromadb
import json
import os
import uuid
import logging
from typing import  Optional
from ..config import BGE_MODEL, CHROMA_PERSIST_DIR, CHROMA_COLLECTION_NAME, HISTORY_TOP_K

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_JSON_PATH = os.path.join(BASE_DIR, "historical_events.json")

_bge = None
_client = None
_collection = None


def get_bge():
    global _bge
    if _bge is None:
        _bge = SentenceTransformer(BGE_MODEL)
    return _bge


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        _collection = _client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def embed_text(text: str) -> list:
    return get_bge().encode("Represent this financial news: " + text, normalize_embeddings=True).tolist()


def seed_from_json(json_path: str = DEFAULT_JSON_PATH, force: bool = False):
    collection = get_collection()
    if collection.count() > 0 and not force:
        return collection.count()

    if not os.path.exists(json_path):
        logger.error("historical_events.json not found")
        return 0

    with open(json_path) as f:
        events = json.load(f)

    ids = []
    embeddings = []
    metadatas = []
    documents = []

    for i, ev in enumerate(events):
        text = ev.get("search_text", ev.get("headline", "") + " " + ev.get("summary", ""))
        if not text.strip():
            continue

        emb = embed_text(text)
        meta = {
            "primary_sector": ev.get("primary_sector", "unknown"),
            "date": ev.get("date", ""),
            "event_type": ev.get("event_type", ""),
            # add more fields you actually have in JSON
        }
        # flatten asset impacts if present
        if "asset_impacts" in ev:
            for asset, data in ev["asset_impacts"].items():
                meta[f"{asset}_1d"] = data.get("1d", 0)
                meta[f"{asset}_1w"] = data.get("1w", 0)
                meta[f"{asset}_1m"] = data.get("1m", 0)

        ids.append(str(uuid.uuid4()))
        embeddings.append(emb)
        metadatas.append(meta)
        documents.append(text[:500])

    if ids:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )

    return len(ids)


def retrieve_similar_events(text: str, top_k: int = HISTORY_TOP_K, sector_filter: Optional[str] = None):
    collection = get_collection()
    if collection.count() == 0:
        return []

    emb = embed_text(text)
    where = {"primary_sector": sector_filter} if sector_filter else None

    res = collection.query(
        query_embeddings=[emb],
        n_results=top_k,
        where=where,
        include=["documents", "metadatas", "distances"]
    )

    out = []
    for i in range(len(res["ids"][0])):
        dist = res["distances"][0][i]
        similarity = 1.0 - dist   # cosine distance → similarity
        out.append({
            "text": res["documents"][0][i],
            "metadata": res["metadatas"][0][i],
            "similarity_score": round(similarity, 3)
        })
    return out


def get_asset_impact_from_metadata(meta: dict, asset: str = "Nifty_50", timeframe: str = "1w") -> float:
    key = f"{asset}_{timeframe}"
    return float(meta.get(key, 0.0))