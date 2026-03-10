import logging
from fastapi import FastAPI, HTTPException
from typing import List, Optional
from pydantic import BaseModel

import os
import sys

# Ensure finora_ml package is accessible even when run directly 
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from finora_ml.pipeline import setup_pipeline, run_event_pipeline
from finora_ml.schemas import EventInput, InvestorPersona, EventClassificationResult
from finora_ml.models.newsscraper import get_financial_news
from finora_ml.models.portfoliotester import analyze_portfolio_impact, PortfolioTestResult

logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(title="Finora ML API", description="AI Event-to-Market Engine")

class NewsResponse(BaseModel):
    """Structured response for scraped financial news events."""
    source: str
    title: str
    summary: str
    url: str
    timestamp: str

class PortfolioImpactRequest(BaseModel):
    """Payload to test how a news string affects a simulated portfolio."""
    news_text: str
    persona: InvestorPersona

@app.on_event("startup")
async def startup_event():
    # Setup the ML pipeline (downloads models, loads chromadb) internally on server start
    logger.info("Starting up Finora ML API server...")
    setup_pipeline()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/news", response_model=List[NewsResponse], tags=["Data Ingestion"])
def fetch_live_news(count: int = 15):
    """
    Scrapes and returns live financial news events from configured sources.
    
    - **count**: Maximum number of recent news articles to fetch (default: 15).
    """
    try:
        data = get_financial_news(target_count=count)
        return data
    except Exception as e:
        logger.error(f"Failed to scrape news: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Bad Gateway: Failed to fetch live news from sources. {str(e)}")

@app.post("/api/analyze_event", response_model=EventClassificationResult, tags=["Core ML Pipeline"])
def classify_event_endpoint(event: EventInput, persona: Optional[InvestorPersona] = None):
    """
    Runs the full NLP pipeline on an arbitrary financial news event.
    
    This endpoint performs:
    - Sentiment Analysis (FinBERT)
    - Zero-Shot Classification (BART)
    - Semantic Search Historical Echo (BGE)
    - (Optional) Gemini API Domino Chain inference
    """
    try:
        result = run_event_pipeline(
            event=event, 
            persona=persona, 
            run_history=True, 
            run_gemini=True
        )
        return result
    except ValueError as ve:
        logger.error(f"Validation Error in pipeline: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to analyze event: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error during ML classification.")

@app.post("/api/portfolio_impact", response_model=PortfolioTestResult, tags=["Portfolio Advisory"])
def test_portfolio_impact(request: PortfolioImpactRequest):
    """
    Analyzes a specific news event's impact on a user's defined mock portfolio.
    
    Generates quantitative estimates (changes in INR) and qualitative advisory.
    """
    try:
        result = analyze_portfolio_impact(request.news_text, request.persona)
        return result
    except Exception as e:
        logger.error(f"Failed to analyze portfolio impact: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to compute portfolio impact simulation.")

# If you want to run this file directly via uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("finora_ml.api:app", host="0.0.0.0", port=8000, reload=True)
