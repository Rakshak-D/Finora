"""
features/investor_persona.py — Persona relevance scoring.
"""

from typing import Optional
from ..schemas import InvestorPersona, ClassificationResult


def get_portfolio_value(persona: Optional[InvestorPersona]) -> float:
    if not persona:
        return 0.0
    if persona.portfolio_value is not None:
        return persona.portfolio_value
    if persona.holdings:
        return sum(h.quantity * h.avg_buy_price for h in persona.holdings)
    return 0.0


def compute_relevance_score(
    persona:        Optional[InvestorPersona],
    classification: ClassificationResult,
) -> float:
    """
    Returns 0.0–1.0 relevance of this event to the user's sector preferences.
    Adds a +0.25 bonus when the primary sector matches exactly.
    """
    if not persona or not persona.sectors:
        return 0.5

    user_sectors = {s.value for s in persona.sectors}
    total = sum(classification.all_sector_scores.get(s, 0.0) for s in user_sectors)
    avg   = total / len(user_sectors)

    if classification.primary_sector in user_sectors:
        avg = min(1.0, avg + 0.25)

    return round(max(0.0, min(1.0, avg)), 3)