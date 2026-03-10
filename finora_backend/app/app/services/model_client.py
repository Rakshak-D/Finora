"""
services/model_client.py

Calls your teammate's classification model API.
Your backend sends the raw headline → gets back category + confidence.

Update MODEL_API_URL to wherever your teammate hosts the model.
"""

import logging
import httpx
from app.models.schemas import ModelClassification

logger = logging.getLogger("finora.model_client")

# ── Config — update this when teammate shares their endpoint ──────────────────
MODEL_API_URL    = "http://localhost:8001/classify"  
MODEL_API_TIMEOUT = 30                                # seconds


async def get_classification(headline: str) -> ModelClassification:
    """
    Send headline to teammate's model and return structured classification.

    Expected request  : POST { "headline": "..." }
    Expected response : {
        "primary_category"  : "war_conflict",
        "secondary_category": "monetary_policy",   # optional
        "confidence_score"  : 0.91,
        "keywords"          : ["war", "nato"]      # optional
    }

    If the model is unreachable, returns a safe fallback so the
    rest of the pipeline doesn't break.
    """
    payload = {"headline": headline}

    try:
        async with httpx.AsyncClient(timeout=MODEL_API_TIMEOUT) as client:
            response = await client.post(MODEL_API_URL, json=payload)
            response.raise_for_status()
            data = response.json()

        return ModelClassification(
            primary_category   = data["primary_category"],
            secondary_category = data.get("secondary_category"),
            confidence_score   = float(data["confidence_score"]),
            keywords           = data.get("keywords", []),
        )

    except httpx.ConnectError:
        logger.error(f"Model API unreachable at {MODEL_API_URL}")
        return _fallback(headline)

    except httpx.TimeoutException:
        logger.error(f"Model API timed out after {MODEL_API_TIMEOUT}s")
        return _fallback(headline)

    except httpx.HTTPStatusError as e:
        logger.error(f"Model API returned {e.response.status_code}: {e.response.text}")
        return _fallback(headline)

    except Exception as e:
        logger.error(f"Unexpected model client error: {e}")
        return _fallback(headline)


def _fallback(headline: str) -> ModelClassification:
    """Safe fallback when model is unavailable."""
    logger.warning("Using fallback classification: 'other'")
    return ModelClassification(
        primary_category  = "other",
        secondary_category= None,
        confidence_score  = 0.0,
        keywords          = [],
    )