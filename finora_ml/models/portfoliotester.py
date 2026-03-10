import logging
from typing import List, Optional
from pydantic import BaseModel
from finora_ml.pipeline import run_event_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, Sector, PortfolioHolding

logger = logging.getLogger(__name__)

class PortfolioTestResult(BaseModel):
    event_summary: str
    primary_sector_affected: str
    sentiment_label: str
    overall_signal: float
    estimated_portfolio_impact: Optional[str]
    ai_advisory: Optional[str]

def analyze_portfolio_impact(news_text: str, persona: InvestorPersona) -> PortfolioTestResult:
    """
    Takes a single news snippet and a user's portfolio persona.
    Runs it through the main ML pipeline to predict direct impact on their holdings.
    """
    event = EventInput(text=news_text)
    
    # Run the core ML AI Pipeline
    holdings_count = len(persona.holdings) if persona.holdings else 0
    logger.info(f"Testing portfolio impact for {holdings_count} holdings...")
    result = run_event_pipeline(
        event=event,
        persona=persona,
        run_history=True,
        run_gemini=True
    )
    
    # Format the analysis into a localized report for the user's portfolio
    impact_estimate = None
    if result.history_echo and result.history_echo.parallels:
        # Check if we gained an explicit INR/Value estimate from History Parallels
        gains = [p.portfolio_gain_inr for p in result.history_echo.parallels if p.portfolio_gain_inr is not None]
        if gains:
            avg_gain = sum(gains) / len(gains)
            direction = "Gain" if avg_gain >= 0 else "Loss"
            impact_estimate = f"Estimated {direction} of ₹{abs(avg_gain):,.2f} based on historical market reactions."
            
    if not impact_estimate:
        # Fallback to qualitative estimation from Domino chain
        if result.domino_chain and result.domino_chain.user_impact:
             impact_estimate = result.domino_chain.user_impact
        else:
             impact_estimate = "Unable to numerically estimate impact. Monitor markets closely."

    advisory = result.persona_summary if result.persona_summary else "No tailored advisory available."

    return PortfolioTestResult(
        event_summary=result.input_text[:150] + "..." if len(result.input_text) > 150 else result.input_text,
        primary_sector_affected=result.classification.primary_sector,
        sentiment_label=result.sentiment.label.value.upper(),
        overall_signal=result.signal_score,
        estimated_portfolio_impact=impact_estimate,
        ai_advisory=advisory
    )
