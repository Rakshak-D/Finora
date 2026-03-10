import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from fastapi.testclient import TestClient

from finora_ml.api import app
from finora_ml.pipeline import run_event_pipeline, setup_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, Sector
from finora_ml.models.newsscraper import get_financial_news

client = TestClient(app)

class TestFinoraMLPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure DB is seeded before testing
        setup_pipeline()

    def test_pipeline_basic(self):
        event = EventInput(
            text="The US Federal Reserve unexpectedly raised interest rates by 50 basis points today, causing a market selloff."
        )
        result = run_event_pipeline(event, run_history=True, run_gemini=False)
        
        self.assertEqual(result.input_text, event.text)
        self.assertIn(result.sentiment.label.value, ["positive", "negative", "neutral"])
        self.assertTrue(hasattr(result.classification, 'primary_sector'))
        self.assertGreaterEqual(result.signal_score, 0.0)

    def test_pipeline_with_persona(self):
        event = EventInput(
            text="Major breakthrough in generic drug manufacturing announced by Sun Pharma today. It will double their revenue."
        )
        persona = InvestorPersona(
            sectors=[Sector.PHARMA, Sector.IT],
            portfolio_value=100000.0
        )
        
        result = run_event_pipeline(event, persona=persona, run_history=True, run_gemini=False)
        
        self.assertIsNotNone(result.persona_relevance)
        self.assertGreaterEqual(result.persona_relevance, 0.0)
        self.assertIsNotNone(result.history_echo)

    # --- New API Tests ---
    
    def test_api_health(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_api_news_scraper(self):
        # We test with a very small count to not strain external servers during unit tests
        response = client.get("/api/news?count=2")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(response.json(), list))

    def test_api_analyze_event_endpoint(self):
        payload = {
            "event": {
                "text": "Tesla announces massive factory expansion in India."
            }
        }
        response = client.post("/api/analyze_event", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue("signal_score" in data)
        self.assertTrue("classification" in data)

    def test_api_portfolio_impact_endpoint(self):
        payload = {
            "news_text": "Tech giants report a slowdown in AI infrastructure spending.",
            "persona": {
                "sectors": ["it", "banking"],
                "portfolio_value": 50000.0
            }
        }
        response = client.post("/api/portfolio_impact", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue("estimated_portfolio_impact" in data)
        self.assertTrue("primary_sector_affected" in data)

if __name__ == '__main__':
    unittest.main()
