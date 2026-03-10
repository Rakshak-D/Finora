"""
models/gemini_client.py — Gemini 1.5 Flash client (with offline fallbacks).
"""

import json
import logging
import os
from functools import lru_cache
from google import genai
from google.genai import types
from finora_ml.config import GEMINI_API_KEY, GEMINI_MODEL
from finora_ml.schemas import DominoChain, DominoNode, GeminiAnalysis

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def get_gemini_model():
    """Lazy load and cache the Gemini GenAI client singleton."""
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY missing → Gemini features will use offline dummies.")
        return None
    return genai.Client(api_key=GEMINI_API_KEY)

def _clean_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        # Remove ```json or ``` and the trailing ```
        lines = text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines)
    return json.loads(text)

# === COMBINED DOMINO & PERSONA ANALYSIS ===
def get_gemini_analysis(text: str, primary_sector: str, sentiment: str, persona_sectors: list[str] | None = None) -> tuple[DominoChain, str | None]:
    """Generates the domino effect map and personalized AI summary in a single optimized Gemini API call."""
    model = get_gemini_model()
    if not model:
        # Offline demo fallback
        return DominoChain(
            trigger_sector=primary_sector,
            chain=[DominoNode(sector="banking", direction="up" if sentiment == "positive" else "down", magnitude="medium", reason="Market ripple effect")],
            user_impact=None
        ), "Offline proxy: The event has a moderate impact on your specific portfolio."
    
    prompt = f"""
    Analyze this financial event and predict its domino effect across different market sectors.
    
    Event: {text}
    Primary Sector: {primary_sector}
    Sentiment: {sentiment}
    
    You MUST return a JSON object with this exact structure:
    {{
      "trigger_sector": "{primary_sector}",
      "chain": [
        {{
          "sector": "string",
          "direction": "up" | "down" | "flat",
          "magnitude": "high" | "medium" | "low",
          "reason": "string"
        }}
      ],
      "user_impact": "string",
      "persona_summary": "string or null"
    }}
    
    Instructions:
    1. Identify 2-3 other sectors affected by this event.
    2. Provide as valid JSON only. Do not add explanations outside the JSON.
    3. 'user_impact': Briefly explain how this affects a portfolio holding {persona_sectors if persona_sectors else 'diversified'} sectors in general.
    4. 'persona_summary': Write a concise 2-sentence summary tailored specifically for an investor holding {persona_sectors if persona_sectors else 'diversified'} assets. Focus on what they should monitor.
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
            
        domino = DominoChain(
            trigger_sector=data.get("trigger_sector", primary_sector),
            chain=chain,
            user_impact=data.get("user_impact")
        )
        persona_sum = data.get("persona_summary")
        return domino, persona_sum
        
    except Exception as e:
        print(f"\n[DEBUG] Gemini Analysis Error: {e}")
        logger.error(f"Gemini API Error in analysis: {e}")
        return DominoChain(
            trigger_sector=primary_sector,
            chain=[],
            user_impact="Failed to generate domino chain due to API error."
        ), None
