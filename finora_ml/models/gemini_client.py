"""
models/gemini_client.py — Gemini 1.5 Flash client (with offline fallbacks).
"""

import json
import logging
import os
from google import genai
from google.genai import types
from finora_ml.config import GEMINI_API_KEY, GEMINI_MODEL
from finora_ml.schemas import DominoChain, DominoNode, GeminiAnalysis

logger = logging.getLogger(__name__)

def _configure_gemini():
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY missing → Gemini features will use offline dummies.")
        return None
    return genai.Client(api_key=GEMINI_API_KEY)

_gemini_client = None
def get_gemini_model():
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = _configure_gemini()
    return _gemini_client

def _clean_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    elif text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    return json.loads(text)

# === DOMINO CHAIN ===
def get_domino_chain(text: str, primary_sector: str, sentiment: str, persona_sectors: list[str] | None = None) -> DominoChain:
    model = get_gemini_model()
    if not model:
        # Offline demo fallback
        return DominoChain(
            trigger_sector=primary_sector,
            chain=[DominoNode(sector="banking", direction="up" if sentiment == "positive" else "down", magnitude="medium", reason="Market ripple effect")],
            user_impact=None
        )
    
    prompt = f"""
    Analyze the following financial event and predict its domino effect across different market sectors.
    Event: {text}
    Primary Sector: {primary_sector}
    Sentiment: {sentiment}
    
    Return a JSON object with the following structure exactly:
    {{
        "trigger_sector": "{primary_sector}",
        "chain": [
            {{
                "sector": "sector_name",
                "direction": "up" or "down" or "flat",
                "magnitude": "high" or "medium" or "low",
                "reason": "brief explanation"
            }}
        ],
        "user_impact": "Explain briefly how this affects a portfolio holding {persona_sectors if persona_sectors else 'diversified'} sectors"
    }}
    Ensure output is valid JSON without markdown wrapping.
    """
    try:
        response = model.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1024,
                response_mime_type="application/json"
            )
        )
        data = _clean_json_response(response.text)
        
        chain = []
        for node in data.get("chain", []):
            chain.append(DominoNode(
                sector=node.get("sector", "unknown"),
                direction=node.get("direction", "flat"),
                magnitude=node.get("magnitude", "low"),
                reason=node.get("reason", "")
            ))
            
        return DominoChain(
            trigger_sector=data.get("trigger_sector", primary_sector),
            chain=chain,
            user_impact=data.get("user_impact")
        )
    except Exception as e:
        print(f"\n[DEBUG] Gemini get_domino_chain Error: {e}")
        logger.error(f"Gemini API Error in get_domino_chain: {e}")
        return DominoChain(
            trigger_sector=primary_sector,
            chain=[],
            user_impact="Failed to generate domino chain due to API error."
        )

# === PERSONA SUMMARY ===
def get_persona_summary(text: str, persona_sectors: list[str]) -> str | None:
    model = get_gemini_model()
    if not model:
        return "Offline proxy: The event has a moderate impact on your specific portfolio."
        
    prompt = f"""
    Given the following financial event:
    "{text}"
    
    Write a concise 2-sentence summary specifically tailored for an investor holding assets in these sectors: {persona_sectors}.
    Focus on what they should monitor. Return just the text string without quotes.
    """
    try:
        response = model.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="text/plain")
        )
        return response.text.strip()
    except Exception as e:
        print(f"\n[DEBUG] Gemini get_persona_summary Error: {e}")
        logger.error(f"Gemini API Error in get_persona_summary: {e}")
        return None
