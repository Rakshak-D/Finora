"""
schemas.py — All Pydantic models for the Finora ML layer.

Rules:
  - signal_score is ALWAYS 0.0–1.0. Multiply by 100 for % display in UI.
  - avg_asset_impacts is ALWAYS populated in HistoryEchoResult (empty dict if no data).
  - PortfolioTestResult lives here so both api.py and portfoliotester.py import from one place.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL  = "neutral"


class RiskAppetite(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE     = "moderate"
    AGGRESSIVE   = "aggressive"


class Sector(str, Enum):
    DEFENCE    = "defence"
    BANKING    = "banking"
    IT         = "it"
    PHARMA     = "pharma"
    ENERGY     = "energy"
    AUTO       = "auto"
    INFRA      = "infra"
    FMCG       = "fmcg"
    METALS     = "metals"
    REALESTATE = "realestate"


class EventInput(BaseModel):
    text:          str  = Field(..., description="Raw news headline or event text")
    deep_analysis: bool = Field(False, description="If True, triggers Gemini deep analysis")


class PortfolioHolding(BaseModel):
    ticker:        str   = Field(..., example="HAL.NS")
    quantity:      int   = Field(1, ge=0)
    avg_buy_price: float = Field(100.0, ge=0)


class InvestorPersona(BaseModel):
    sectors:         List[Sector]
    risk_appetite:   RiskAppetite                    = RiskAppetite.MODERATE
    holdings:        Optional[List[PortfolioHolding]] = None
    portfolio_value: Optional[float]                  = None


class SentimentResult(BaseModel):
    label:     Sentiment
    score:     float
    raw_label: str


class ClassificationResult(BaseModel):
    primary_sector:    str
    event_type:        str
    confidence:        float
    all_sector_scores: Dict[str, float]


class DominoNode(BaseModel):
    sector:    str
    direction: str
    magnitude: str
    reason:    str


class DominoChain(BaseModel):
    trigger_sector: str
    chain:          List[DominoNode]
    user_impact:    Optional[str] = None


class HistoricalParallel(BaseModel):
    event_date:         str
    event_summary:      str
    sector:             str
    similarity_score:   float
    price_changes:      Dict[str, float]
    portfolio_gain_inr: Optional[float] = None


class HistoryEchoResult(BaseModel):
    parallels:           List[HistoricalParallel]
    avg_sector_move_pct: float
    echo_summary:        str
    # Populated by pipeline._compute_avg_asset_impacts() — used for chart rendering
    avg_asset_impacts:   Dict[str, float] = Field(default_factory=dict)


class GeminiAnalysis(BaseModel):
    summary:       str
    key_drivers:   List[str]
    risks:         List[str]
    opportunities: List[str]
    time_horizon:  str


class EventClassificationResult(BaseModel):
    input_text:        str
    sentiment:         SentimentResult
    classification:    ClassificationResult
    domino_chain:      Optional[DominoChain]       = None
    history_echo:      Optional[HistoryEchoResult] = None
    gemini_analysis:   Optional[GeminiAnalysis]    = None
    persona_relevance: Optional[float]             = None
    persona_summary:   Optional[str]               = None
    signal_score:      float  # always 0.0–1.0


class PortfolioTestResult(BaseModel):
    overall_signal:             float
    primary_sector_affected:    str
    estimated_portfolio_impact: str
    ai_advisory:                str
    asset_impacts:              Dict[str, float] = Field(default_factory=dict)