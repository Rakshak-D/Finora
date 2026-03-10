from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class SentimentLabel(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL  = "neutral"


class MarketImpact(str, Enum):
    HIGH   = "high"
    MEDIUM = "medium"
    LOW    = "low"

class SentimentResult(BaseModel):
    label: SentimentLabel
    score: float                # confidence  0.0 - 1.0
    positive_score: float
    negative_score: float
    neutral_score: float


class ClassificationResult(BaseModel):
    """Populated entirely from teammate model response."""
    primary_category: str
    secondary_category: Optional[str] = None
    confidence_score: float
    keywords: list[str] = []


class ImpactResult(BaseModel):
    impact_level: MarketImpact
    impact_score: float         # 0.0 - 10.0
    affected_sectors: list[str]
    affected_companies: list[str]
    affected_indices: list[str]
    rationale: str

class ScrapeRequest(BaseModel):
    """Payload sent by the Chrome extension."""
    headline: str
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    scraped_at: Optional[datetime] = None


class ModelClassification(BaseModel):
    """
    Shape of response your backend expects from the teammate model API.
    Adjust fields to match whatever they actually return.
    """
    primary_category: str
    secondary_category: Optional[str] = None
    confidence_score: float
    keywords: Optional[list[str]] = []


class AnalyzedHeadline(BaseModel):
    id: str
    headline: str
    source_url: Optional[str]
    source_name: Optional[str]
    scraped_at: Optional[datetime]
    processed_at: datetime
    sentiment: SentimentResult
    classification: ClassificationResult
    impact: ImpactResult