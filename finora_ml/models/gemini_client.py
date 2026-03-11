"""
models/gemini_client.py — Gemini client (google-genai SDK).
Install: pip install google-genai

.env format (no quotes):
    GEMINI_API_KEY=AIzaSy...yourkey
"""

import json
import logging
import os
from typing import Optional

from ..config import GEMINI_MODEL, GEMINI_API_KEY
from ..schemas import DominoChain, DominoNode

logger = logging.getLogger(__name__)

_gemini_client = None


def get_gemini_client():
    global _gemini_client
    if _gemini_client is not None:
        return _gemini_client

    api_key = GEMINI_API_KEY.strip()
    if not api_key:
        logger.warning("GEMINI_API_KEY is empty. Add it to your .env file: GEMINI_API_KEY=your_key")
        return None

    try:
        os.environ["GOOGLE_API_KEY"] = api_key
        from google import genai
        _gemini_client = genai.Client()
        logger.info(f"Gemini client ready (model: {GEMINI_MODEL})")
        return _gemini_client
    except ImportError:
        logger.error("google-genai not installed. Run: pip install google-genai")
        return None
    except Exception as e:
        logger.error(f"Gemini client init failed: {e}")
        return None


def _clean_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        lines = lines[1:] if lines[0].startswith("```") else lines
        lines = lines[:-1] if lines and lines[-1].startswith("```") else lines
        text  = "\n".join(lines)
    return json.loads(text.strip())


def _offline_fallback(primary_sector: str, sentiment: str) -> tuple:
    direction = "up" if sentiment == "positive" else "down" if sentiment == "negative" else "flat"
    return (
        DominoChain(
            trigger_sector=primary_sector,
            chain=[DominoNode(
                sector="broad_market", direction=direction,
                magnitude="medium",
                reason="Gemini unavailable — set GEMINI_API_KEY in .env and restart the server."
            )],
            user_impact=None,
        ),
        None,
    )


def get_gemini_analysis(
    text:            str,
    primary_sector:  str,
    sentiment:       str,
    persona_sectors: Optional[list] = None,
) -> tuple:
    """
    Single Gemini call → (DominoChain, persona_summary | None).
    Falls back gracefully when key is missing or API errors occur.
    """
    client = get_gemini_client()
    if not client:
        return _offline_fallback(primary_sector, sentiment)

    persona_ctx = (
        f"The investor holds: {', '.join(persona_sectors)} sector(s)."
        if persona_sectors else "The investor has a diversified portfolio."
    )

    prompt = f"""You are an expert Indian market analyst. A financial event has occurred.

EVENT: {text}
PRIMARY SECTOR: {primary_sector}
SENTIMENT: {sentiment}
INVESTOR PROFILE: {persona_ctx}

Return ONLY valid JSON (no markdown, no preamble):
{{
  "trigger_sector": "{primary_sector}",
  "chain": [
    {{
      "sector": "sector_name",
      "direction": "up|down|flat",
      "magnitude": "high|medium|low",
      "reason": "one sentence causal explanation focused on Indian NSE/BSE market"
    }}
  ],
  "user_impact": "one sentence how this affects the described investor",
  "persona_summary": "one direct sentence for this investor starting with their sector"
}}

Rules: 2-4 chain nodes; sectors DIFFERENT from {primary_sector}; NSE/BSE context; name specific Indian companies or indices."""

    try:
        from google.genai import types
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        data = _clean_json(response.text)

        domino = DominoChain(
            trigger_sector=data.get("trigger_sector", primary_sector),
            chain=[
                DominoNode(
                    sector=n.get("sector", "unknown"),
                    direction=n.get("direction", "flat"),
                    magnitude=n.get("magnitude", "low"),
                    reason=n.get("reason", ""),
                )
                for n in data.get("chain", [])
            ],
            user_impact=data.get("user_impact"),
        )
        return domino, data.get("persona_summary")

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return _offline_fallback(primary_sector, sentiment)