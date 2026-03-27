from __future__ import annotations

from typing import Dict

from finora_ml.schemas import InvestorPersona


class PortfolioRepository:
    def __init__(self):
        self._profiles: Dict[str, InvestorPersona] = {}

    def save(self, profile_id: str, persona: InvestorPersona) -> InvestorPersona:
        self._profiles[profile_id] = persona
        return persona


portfolio_repository = PortfolioRepository()
