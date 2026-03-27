from fastapi import APIRouter, Request

from finora_ml.infra.http import raise_api_error
from finora_ml.infra.rate_limit import enforce_rate_limit
from finora_ml.schemas import PortfolioImpactRequest, PortfolioStressResponse
from finora_ml.services.portfolio_service import portfolio_service

router = APIRouter()


@router.post("/api/portfolio_impact", response_model=PortfolioStressResponse)
def portfolio_impact(body: PortfolioImpactRequest, request: Request):
    enforce_rate_limit(request, scope="portfolio_impact", limit=12, window_seconds=60)
    try:
        return portfolio_service.stress(body.news_text, body.persona)
    except Exception as exc:
        raise_api_error(500, "portfolio_impact_failed", "Portfolio impact analysis failed.", str(exc))


@router.post("/api/portfolio/stress", response_model=PortfolioStressResponse)
def portfolio_stress(body: PortfolioImpactRequest, request: Request):
    enforce_rate_limit(request, scope="portfolio_stress", limit=12, window_seconds=60)
    try:
        return portfolio_service.stress(body.news_text, body.persona)
    except Exception as exc:
        raise_api_error(500, "portfolio_stress_failed", "Portfolio stress test failed.", str(exc))
