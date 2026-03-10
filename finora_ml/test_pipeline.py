import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from finora_ml.pipeline import run_event_pipeline, setup_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, Sector

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

if __name__ == '__main__':
    unittest.main()
