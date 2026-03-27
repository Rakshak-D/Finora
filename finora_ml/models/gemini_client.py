"""
models/gemini_client.py — Gemini client (google-genai SDK).
Install: pip install google-genai

.env format (no quotes):
    GEMINI_API_KEY=AIzaSy...yourkey
"""

import json
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

from ..config import GEMINI_MODEL
from ..schemas import DominoChain, DominoNode

logger = logging.getLogger(__name__)

_gemini_client = None
_gemini_client_key = None
_missing_key_warned = False
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"

_SECTOR_RIPPLE_MAP = {
    "banking": ["broad_market", "realestate", "auto"],
    "it": ["broad_market", "fmcg", "pharma"],
    "pharma": ["fmcg", "it", "broad_market"],
    "energy": ["auto", "metals", "broad_market"],
    "auto": ["metals", "energy", "broad_market"],
    "infra": ["metals", "cement", "broad_market"],
    "fmcg": ["broad_market", "banking", "pharma"],
    "metals": ["infra", "auto", "broad_market"],
    "realestate": ["banking", "cement", "broad_market"],
    "defence": ["infra", "metals", "broad_market"],
}


def _dedupe(items: list[str]) -> list[str]:
    seen = set()
    output: list[str] = []
    for item in items:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            output.append(item)
    return output


def get_gemini_client():
    global _gemini_client, _gemini_client_key, _missing_key_warned
    load_dotenv(_ENV_PATH, override=True)
    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or "").strip().strip('"').strip("'")
    if not api_key:
        if not _missing_key_warned:
            logger.warning("GEMINI_API_KEY is empty. Finora will use local domino fallback analysis.")
            _missing_key_warned = True
        return None

    if _gemini_client is not None and _gemini_client_key == api_key:
        return _gemini_client

    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        _gemini_client_key = api_key
        logger.info(f"Gemini client ready (model: {os.getenv('GEMINI_MODEL', GEMINI_MODEL)})")
        return _gemini_client
    except ImportError:
        logger.error("google-genai not installed. Run: pip install google-genai")
        return None
    except Exception as e:
        logger.error(f"Gemini client init failed: {e}")
        _gemini_client = None
        _gemini_client_key = None
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
                reason="Local fallback analysis is active while premium AI explanations are unavailable."
            )],
            user_impact=None,
        ),
        None,
    )


def _build_local_reason(primary_sector: str, downstream_sector: str, direction: str, position: int) -> str:
    if direction == "up":
        templates = [
            f"Strength in {primary_sector.replace('_', ' ')} often lifts {downstream_sector.replace('_', ' ')} as risk appetite improves.",
            f"A positive shock in {primary_sector.replace('_', ' ')} can attract flows into {downstream_sector.replace('_', ' ')} next.",
            f"If {primary_sector.replace('_', ' ')} keeps outperforming, traders usually rotate into {downstream_sector.replace('_', ' ')}.",
        ]
    elif direction == "down":
        templates = [
            f"Pressure in {primary_sector.replace('_', ' ')} usually spills into {downstream_sector.replace('_', ' ')} as sentiment weakens.",
            f"When {primary_sector.replace('_', ' ')} loses momentum, investors often cut exposure in {downstream_sector.replace('_', ' ')} too.",
            f"Stress around {primary_sector.replace('_', ' ')} can widen risk-off moves across {downstream_sector.replace('_', ' ')}.",
        ]
    else:
        templates = [
            f"{downstream_sector.replace('_', ' ')} may stay range-bound while the market digests this {primary_sector.replace('_', ' ')} signal.",
            f"Traders are likely to wait for confirmation before repricing {downstream_sector.replace('_', ' ')}.",
            f"The next move in {downstream_sector.replace('_', ' ')} depends on whether this {primary_sector.replace('_', ' ')} event strengthens further.",
        ]
    return templates[min(position, len(templates) - 1)]


def _build_local_persona_summary(primary_sector: str, direction: str, persona_sectors: Optional[list]) -> Optional[str]:
    if not persona_sectors:
        return None
    normalized = [str(sector).lower() for sector in persona_sectors]
    ripple_sectors = _dedupe([primary_sector.lower(), *[item.lower() for item in _SECTOR_RIPPLE_MAP.get(primary_sector.lower(), [])]])
    overlaps = [sector for sector in normalized if sector in ripple_sectors]
    if overlaps:
        joined = ", ".join(sector.replace("_", " ") for sector in overlaps[:3])
        if direction == "down":
            return f"Your {joined} exposure sits close to this ripple, so prioritize capital protection and staggered entries."
        if direction == "up":
            return f"Your {joined} exposure aligns with the current ripple, so watch for follow-through before adding risk."
        return f"Your {joined} exposure is relevant here, but the signal still looks early and needs confirmation."

    joined = ", ".join(sector.replace("_", " ") for sector in normalized[:3])
    return f"Your selected sectors ({joined}) are one step removed from this event, so second-order effects matter more than the first headline."


def _local_fallback(primary_sector: str, sentiment: str, persona_sectors: Optional[list] = None) -> tuple[DominoChain, Optional[str]]:
    normalized_primary = (primary_sector or "broad_market").strip().lower().replace(" ", "_")
    direction = "up" if sentiment == "positive" else "down" if sentiment == "negative" else "flat"
    magnitude = "high" if direction != "flat" else "medium"
    ripple_targets = _SECTOR_RIPPLE_MAP.get(normalized_primary, ["broad_market", "banking", "it"])
    ripple_targets = [target for target in ripple_targets if target != normalized_primary][:3]

    chain = [
        DominoNode(
            sector=target,
            direction=direction,
            magnitude=magnitude if index == 0 else "medium",
            reason=_build_local_reason(normalized_primary, target, direction, index),
        )
        for index, target in enumerate(ripple_targets)
    ]

    if direction == "down":
        user_impact = "This setup favors caution first: focus on drawdown control, position sizing, and avoiding emotional adds."
    elif direction == "up":
        user_impact = "This setup supports selective upside participation, but it still makes sense to wait for confirmation from price action."
    else:
        user_impact = "This looks like a watchlist event for now, with positioning likely to matter more than immediate action."

    return (
        DominoChain(
            trigger_sector=normalized_primary,
            chain=chain,
            user_impact=user_impact,
        ),
        _build_local_persona_summary(normalized_primary, direction, persona_sectors),
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
        return _local_fallback(primary_sector, sentiment, persona_sectors)

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
        model_name = (os.getenv("GEMINI_MODEL") or GEMINI_MODEL).strip() or GEMINI_MODEL
        response = client.models.generate_content(
            model=model_name,
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
        return _local_fallback(primary_sector, sentiment, persona_sectors)
