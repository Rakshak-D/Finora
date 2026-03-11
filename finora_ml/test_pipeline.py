"""
tests.py — Finora ML unit + API tests.
Fix: /api/health returns {"status":"ok"} — test now checks only that key.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import unittest
from fastapi.testclient import TestClient

from finora_ml.api import app
from finora_ml.pipeline import run_event_pipeline, setup_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, Sector

client = TestClient(app)


class TestFinoraMLPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        setup_pipeline()

    def test_pipeline_basic(self):
        event  = EventInput(text="The US Federal Reserve raised interest rates by 50 bps, causing a market selloff.")
        result = run_event_pipeline(event, run_history=True, run_gemini=False)
        self.assertEqual(result.input_text, event.text)
        self.assertIn(result.sentiment.label.value, ["positive", "negative", "neutral"])
        self.assertTrue(hasattr(result.classification, "primary_sector"))
        self.assertGreaterEqual(result.signal_score, 0.0)
        self.assertLessEqual(result.signal_score, 1.0)

    def test_pipeline_with_persona(self):
        event   = EventInput(text="Sun Pharma receives USFDA approval for generic cancer drug entering $800M US market.")
        persona = InvestorPersona(sectors=[Sector.PHARMA, Sector.IT], portfolio_value=100000.0)
        result  = run_event_pipeline(event, persona=persona, run_history=True, run_gemini=False)
        self.assertIsNotNone(result.persona_relevance)
        self.assertIsNotNone(result.history_echo)
        # avg_asset_impacts must always be a dict
        self.assertIsInstance(result.history_echo.avg_asset_impacts, dict)

    def test_signal_score_range(self):
        for text in [
            "Massive fraud detected at major bank, shares crash 40%",
            "RBI holds repo rate steady as expected",
            "TCS wins $2.5B contract from UK retail bank",
        ]:
            result = run_event_pipeline(EventInput(text=text), run_history=False, run_gemini=False)
            self.assertGreaterEqual(result.signal_score, 0.0)
            self.assertLessEqual(result.signal_score, 1.0)

    # ── API tests ──────────────────────────────────────────────────────────────

    def test_api_health(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        # Only assert the "status" key — allows extra fields in future without breaking
        self.assertEqual(response.json().get("status"), "ok")

    def test_api_config(self):
        response = client.get("/api/config")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("sectors", data)
        self.assertIn("tracked_assets", data)
        # risk_appetite_options must be plain strings (no .value bug)
        for opt in data.get("risk_appetite_options", []):
            self.assertIsInstance(opt, str)

    def test_api_news(self):
        response = client.get("/api/news?count=2")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_api_analyze_event(self):
        payload  = {"event": {"text": "Tesla announces India factory expansion.", "deep_analysis": False}}
        response = client.post("/api/analyze_event", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("signal_score", data)
        self.assertIn("classification", data)
        self.assertIn("history_echo", data)
        # Ensure avg_asset_impacts is present
        if data["history_echo"]:
            self.assertIn("avg_asset_impacts", data["history_echo"])

    def test_api_portfolio_impact(self):
        payload = {
            "news_text": "Tech giants report slowdown in AI infrastructure spending.",
            "persona":   {"sectors": ["it", "banking"], "portfolio_value": 50000.0},
        }
        response = client.post("/api/portfolio_impact", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("estimated_portfolio_impact", data)
        self.assertIn("primary_sector_affected", data)
        self.assertIn("asset_impacts", data)
        self.assertGreaterEqual(data["overall_signal"], 0.0)
        self.assertLessEqual(data["overall_signal"], 1.0)


if __name__ == "__main__":
    unittest.main()