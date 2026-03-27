from __future__ import annotations

import re

from finora_ml.models.portfoliotester import analyze_portfolio_impact
from finora_ml.schemas import InvestorPersona, PortfolioStressResponse


class PortfolioService:
    def _parse_inr_value(self, value: str) -> float | None:
        digits = re.sub(r"[^0-9.\-]", "", value or "")
        if not digits:
            return None
        try:
            return float(digits)
        except ValueError:
            return None

    def stress(self, news_text: str, persona: InvestorPersona) -> PortfolioStressResponse:
        result = analyze_portfolio_impact(news_text, persona)
        estimated_value = self._parse_inr_value(result.estimated_portfolio_impact)
        band_low = round((estimated_value or 0) * 0.8, 2) if estimated_value is not None else None
        band_high = round((estimated_value or 0) * 1.2, 2) if estimated_value is not None else None
        return PortfolioStressResponse(
            overall_signal=result.overall_signal,
            primary_sector_affected=result.primary_sector_affected,
            estimated_portfolio_impact=result.estimated_portfolio_impact,
            estimated_rupee_range={"low": band_low, "high": band_high},
            ai_advisory=result.ai_advisory,
            asset_impacts=result.asset_impacts,
        )


portfolio_service = PortfolioService()
