"""
features/history_echo.py — History Echo: find similar past events and compute impact.
"""

import logging
from typing import Optional, List

from ..schemas import InvestorPersona, HistoricalParallel, HistoryEchoResult
from ..models.embeddings import retrieve_similar_events, get_asset_impact_from_metadata
from ..config import HISTORY_TOP_K, TRACKED_ASSETS

logger = logging.getLogger(__name__)


def run_history_echo(
    event_text: str,
    persona:    Optional[InvestorPersona] = None,
    top_k:      int = HISTORY_TOP_K,
    timeframe:  str = "1w",
) -> HistoryEchoResult:
    """
    Semantically search ChromaDB for historical parallels and compute market impact.

    Falls back to unfiltered search when sector-filtered results are < 2.
    avg_asset_impacts is NOT populated here — pipeline.py fills it after this returns.
    """
    sector_filter = persona.sectors[0].value if (persona and persona.sectors) else None

    similar = retrieve_similar_events(text=event_text, top_k=top_k, sector_filter=sector_filter)

    # Fall back to unfiltered if sector filter yields too few results
    if len(similar) < 2 and sector_filter:
        similar = retrieve_similar_events(text=event_text, top_k=top_k)

    if not similar:
        return HistoryEchoResult(
            parallels=[],
            avg_sector_move_pct=0.0,
            echo_summary="No historical parallels found.",
            avg_asset_impacts={},
        )

    parallels:        List[HistoricalParallel] = []
    nifty_changes:    List[float]              = []

    for past in similar:
        metadata = past["metadata"]
        sector   = metadata.get("primary_sector", "unknown")
        date     = metadata.get("date", "unknown")

        # Collect price changes for ALL tracked assets (skip zeros to keep payload clean)
        price_changes: dict = {}
        for asset in TRACKED_ASSETS:
            pct = get_asset_impact_from_metadata(metadata, asset, timeframe)
            if pct != 0.0:
                # Store under display-friendly key "Nifty 50", "Bank Nifty" etc.
                display = asset.replace("_", " ")
                price_changes[display] = pct

        # Portfolio ₹ impact estimate using Nifty 50 as proxy
        portfolio_gain: Optional[float] = None
        if persona:
            pv = persona.portfolio_value or 0.0
            if pv > 0:
                nifty_change = get_asset_impact_from_metadata(metadata, "Nifty_50", timeframe)
                if nifty_change != 0.0:
                    portfolio_gain = round(pv * (nifty_change / 100), 0)

        parallels.append(HistoricalParallel(
            event_date=date,
            event_summary=past["text"][:120] + ("…" if len(past["text"]) > 120 else ""),
            sector=sector,
            similarity_score=past["similarity_score"],
            price_changes=price_changes,
            portfolio_gain_inr=portfolio_gain,
        ))

        nifty_change = get_asset_impact_from_metadata(metadata, "Nifty_50", timeframe)
        if nifty_change != 0.0:
            nifty_changes.append(nifty_change)

    avg_move  = round(sum(nifty_changes) / len(nifty_changes), 1) if nifty_changes else 0.0
    direction = "gain" if avg_move > 0 else "decline" if avg_move < 0 else "flat"
    summary   = (
        f"Historical echo: {len(parallels)} similar events → "
        f"Nifty {direction} avg {abs(avg_move):.1f}% in {timeframe}"
    )

    return HistoryEchoResult(
        parallels=parallels,
        avg_sector_move_pct=avg_move,
        echo_summary=summary,
        avg_asset_impacts={},   # filled by pipeline._compute_avg_asset_impacts()
    )