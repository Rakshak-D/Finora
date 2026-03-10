from pydantic import BaseModel, Field
from typing import Optional, List
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
    DEFENCE      = "defence"
    BANKING      = "banking"
    IT           = "it"
    PHARMA       = "pharma"
    ENERGY       = "energy"
    AUTO         = "auto"
    INFRA        = "infra"
    FMCG         = "fmcg"
    METALS       = "metals"
    REALESTATE   = "realestate"


class EventInput(BaseModel):
    text: str = Field(...)
    deep_analysis: bool = Field(default=False)


class PortfolioHolding(BaseModel):
    ticker: str
    quantity: int
    avg_buy_price: float


class InvestorPersona(BaseModel):
    sectors: List[Sector]
    risk_appetite: RiskAppetite = RiskAppetite.MODERATE
    holdings: Optional[List[PortfolioHolding]] = None
    portfolio_value: Optional[float] = None


class SentimentResult(BaseModel):
    label: Sentiment
    score: float
    raw_label: str


class ClassificationResult(BaseModel):
    primary_sector: str
    event_type: str
    confidence: float
    all_sector_scores: dict[str, float]


class DominoNode(BaseModel):
    sector: str
    direction: str
    magnitude: str
    reason: str


class DominoChain(BaseModel):
    trigger_sector: str
    chain: List[DominoNode]
    user_impact: Optional[str] = None


class HistoricalParallel(BaseModel):
    event_date: str
    event_summary: str
    sector: str
    similarity_score: float
    price_changes: dict[str, float]
    portfolio_gain_inr: Optional[float] = None


class HistoryEchoResult(BaseModel):
    parallels: List[HistoricalParallel]
    avg_sector_move_pct: float
    echo_summary: str


class GeminiAnalysis(BaseModel):
    summary: str
    key_drivers: List[str]
    risks: List[str]
    opportunities: List[str]
    time_horizon: str


class EventClassificationResult(BaseModel):
    input_text: str
    sentiment: SentimentResult
    classification: ClassificationResult
    domino_chain: Optional[DominoChain] = None
    history_echo: Optional[HistoryEchoResult] = None
    gemini_analysis: Optional[GeminiAnalysis] = None
    persona_relevance: Optional[float] = None
    persona_summary: Optional[str] = None
    signal_score: float