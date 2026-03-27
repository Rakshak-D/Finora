"""
schemas.py — Shared Pydantic models for the Finora ML layer and frontend contracts.
"""

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


def _clean_text(value: str) -> str:
    return " ".join(value.replace("\x00", " ").split())


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class RiskAppetite(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


class Sector(str, Enum):
    DEFENCE = "defence"
    BANKING = "banking"
    IT = "it"
    PHARMA = "pharma"
    ENERGY = "energy"
    AUTO = "auto"
    INFRA = "infra"
    FMCG = "fmcg"
    METALS = "metals"
    REALESTATE = "realestate"


class EventInput(BaseModel):
    text: str = Field(..., description="Raw news headline or event text")
    deep_analysis: bool = Field(False, description="If True, triggers Gemini deep analysis")

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        cleaned = _clean_text(value)
        if len(cleaned) < 10:
            raise ValueError("Event text must be at least 10 characters.")
        if len(cleaned) > 800:
            raise ValueError("Event text must be 800 characters or fewer.")
        return cleaned


class PortfolioHolding(BaseModel):
    ticker: str = Field(..., example="HAL.NS")
    quantity: int = Field(1, ge=0)
    avg_buy_price: float = Field(100.0, ge=0)

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, value: str) -> str:
        cleaned = _clean_text(value).upper()
        if len(cleaned) < 2 or len(cleaned) > 20:
            raise ValueError("Ticker must be between 2 and 20 characters.")
        return cleaned


class InvestorPersona(BaseModel):
    sectors: List[Sector]
    risk_appetite: RiskAppetite = RiskAppetite.MODERATE
    holdings: Optional[List[PortfolioHolding]] = None
    portfolio_value: Optional[float] = None

    @model_validator(mode="after")
    def validate_persona(self):
        if not self.sectors:
            raise ValueError("At least one sector must be selected.")
        return self


class SentimentResult(BaseModel):
    label: Sentiment
    score: float
    raw_label: str


class ClassificationResult(BaseModel):
    primary_sector: str
    event_type: str
    confidence: float
    all_sector_scores: Dict[str, float]


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
    price_changes: Dict[str, float]
    portfolio_gain_inr: Optional[float] = None


class HistoryEchoResult(BaseModel):
    parallels: List[HistoricalParallel]
    avg_sector_move_pct: float
    echo_summary: str
    avg_asset_impacts: Dict[str, float] = Field(default_factory=dict)


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


class PortfolioTestResult(BaseModel):
    overall_signal: float
    primary_sector_affected: str
    estimated_portfolio_impact: str
    ai_advisory: str
    asset_impacts: Dict[str, float] = Field(default_factory=dict)


class AnalyzeEventRequest(BaseModel):
    event: EventInput
    persona: Optional[InvestorPersona] = None


class PortfolioImpactRequest(BaseModel):
    news_text: str
    persona: InvestorPersona

    @field_validator("news_text")
    @classmethod
    def validate_news_text(cls, value: str) -> str:
        cleaned = _clean_text(value)
        if len(cleaned) < 10:
            raise ValueError("News text must be at least 10 characters.")
        if len(cleaned) > 800:
            raise ValueError("News text must be 800 characters or fewer.")
        return cleaned


class ConfigResponse(BaseModel):
    sectors: List[str]
    risk_appetite_options: List[str]
    event_types: List[str]
    default_portfolio_value: float
    default_avg_buy_price: float
    news_default_count: int
    history_top_k: int
    tracked_assets: List[str]


class DashboardOverview(BaseModel):
    markets_tracked: int
    live_articles: int
    historical_events: int
    coach_readiness: int
    beginner_message: str
    last_updated: str


class NewsResponse(BaseModel):
    source: str
    title: str
    summary: str
    url: str
    timestamp: str


class MarketInstrument(BaseModel):
    id: str
    symbol: str
    display_name: str
    category: str
    market: str
    currency: str
    provider: str
    price: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    sparkline: List[float] = Field(default_factory=list)
    session: str = "closed"
    status: str = "unavailable"
    last_updated: Optional[str] = None


class MarketSnapshotResponse(BaseModel):
    instruments: List[MarketInstrument]
    provider: str
    partial: bool = False
    last_updated: str


class MarketCandle(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0


class MarketCandleResponse(BaseModel):
    instrument: str
    interval: str
    provider: str
    candles: List[MarketCandle]
    last_updated: str


class SectorSnapshotItem(BaseModel):
    key: str
    name: str
    change_percent: Optional[float] = None
    linked_symbol: Optional[str] = None
    market_cap_label: str = ""
    leaders: Optional[int] = None
    laggards: Optional[int] = None


class SectorSnapshotResponse(BaseModel):
    sectors: List[SectorSnapshotItem]
    provider: str
    last_updated: str


class LegacyMarketDataResponse(BaseModel):
    indices: List[dict]
    last_updated: str


class LegacySectorDataResponse(BaseModel):
    sectors: List[dict]
    last_updated: str


class HistoricalEventsResponse(BaseModel):
    events: List[dict]
    count: int
    last_updated: str


class NewsArticle(BaseModel):
    id: str
    title: str
    source: str
    url: str
    published_at: Optional[str] = None
    fetched_at: str
    summary: str
    source_quality: str = "medium"
    image_url: Optional[str] = None
    urgency: str = "low"
    entities: List[str] = Field(default_factory=list)
    one_line_take: str = ""
    beginner_summary: str = ""


class HistoricalParallelInsight(BaseModel):
    title: str
    outcome: str
    similarity: float


class GraphNode(BaseModel):
    id: str
    label: str
    kind: str
    impact: float
    confidence: float
    direction: str = "flat"


class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float
    reason: str


class InsightGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class CoachBrief(BaseModel):
    what_happened: str
    why_it_matters: str
    what_to_do_next: str
    glossary: List[str] = Field(default_factory=list)


class NewsInsightRequest(BaseModel):
    article_id: Optional[str] = None
    title: Optional[str] = None
    text: Optional[str] = None
    url: Optional[str] = None
    persona: Optional[InvestorPersona] = None

    @field_validator("article_id", "title", "text", "url")
    @classmethod
    def normalize_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        cleaned = _clean_text(value)
        return cleaned or None

    @model_validator(mode="after")
    def ensure_reference_present(self):
        if not any([self.article_id, self.title, self.text, self.url]):
            raise ValueError("Provide an article_id, title, text, or url.")
        return self


class NewsInsight(BaseModel):
    id: str
    headline: str
    source_name: str
    source_url: Optional[str] = None
    one_line_take: str
    beginner_summary: str
    should_care: str
    confidence: float
    urgency: str
    historical_parallels: List[HistoricalParallelInsight]
    graph: InsightGraph
    coach_brief: CoachBrief
    analysis: Optional[EventClassificationResult] = None
    generated_at: str


class PortfolioStressResponse(BaseModel):
    overall_signal: float
    primary_sector_affected: str
    estimated_portfolio_impact: str
    estimated_rupee_range: Dict[str, Optional[float]] = Field(default_factory=dict)
    ai_advisory: str
    asset_impacts: Dict[str, float] = Field(default_factory=dict)


class RuntimeComponentStatus(BaseModel):
    name: str
    provider: str
    ready: bool
    using_gpu: bool = False
    detail: Optional[str] = None


class SystemStatusResponse(BaseModel):
    api_status: str
    pipeline_ready: bool
    gpu_enabled: bool
    gpu_device: Optional[str] = None
    cuda_available: bool
    vector_store_ready: bool
    models: List[RuntimeComponentStatus]
    last_updated: str


class AssetPrediction(BaseModel):
    instrument_id: str
    display_name: str
    symbol: str
    current_price: Optional[float] = None
    predicted_price: Optional[float] = None
    current_change_percent: Optional[float] = None
    projected_change_percent: Optional[float] = None
    trend: str
    confidence: int
    rationale: str


class SectorPrediction(BaseModel):
    key: str
    name: str
    current_change_percent: Optional[float] = None
    forecast_bias: str
    horizon: str
    confidence: int
    rationale: str


class PredictionOverviewResponse(BaseModel):
    summary: str
    assets: List[AssetPrediction]
    sectors: List[SectorPrediction]
    last_updated: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict | list | str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool


class PaginatedNewsResponse(BaseModel):
    items: List[NewsArticle]
    meta: PaginationMeta
    last_updated: str


class HistoricalEventAssetImpact(BaseModel):
    est_pct_1d: Optional[float] = None
    est_pct_1w: Optional[float] = None
    est_pct_1m: Optional[float] = None


class HistoricalEventSummary(BaseModel):
    id: str
    event: str
    description: str
    event_type: str
    year: int = 0
    date: str
    primary_sector: str
    sectors_affected: List[str] = Field(default_factory=list)
    asset_impacts: Dict[str, HistoricalEventAssetImpact] = Field(default_factory=dict)
    india_impact: str = ""
    reasoning: str = ""
    confidence: str = ""


class PaginatedHistoricalEventsResponse(BaseModel):
    items: List[HistoricalEventSummary]
    meta: PaginationMeta
    last_updated: str
