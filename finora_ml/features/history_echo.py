import logging
from typing import Optional, List

from ..schemas import InvestorPersona, HistoricalParallel, HistoryEchoResult
from ..models.embeddings import retrieve_similar_events, get_asset_impact_from_metadata
from ..config import HISTORY_TOP_K, TRACKED_ASSETS

logger = logging.getLogger(__name__)

PERSONA_SECTOR_TO_ASSET = {
    "banking":    ["Bank_Nifty", "Nifty_50"],
    "it":         ["Nifty_IT", "Nifty_50"],
    "defence":    ["Nifty_50"],
    "pharma":     ["Nifty_50"],
    "energy":     ["Crude_Oil", "Nifty_50"],
    "auto":       ["Nifty_50"],
    "infra":      ["Nifty_50"],
    "fmcg":       ["Nifty_50"],
    "metals":     ["Nifty_50"],
    "realestate": ["Nifty_50"],
}

def run_history_echo(
    event_text: str,
    persona: Optional[InvestorPersona] = None,
    top_k: int = HISTORY_TOP_K,
    timeframe: str = "1w"
) -> HistoryEchoResult:
    """
    Finds historical macroeconomic parallels from Semantically Similar historical events 
    and averages their immediate market impacts.
    """
    sector_filter = None
    if persona and persona.sectors:
        sector_filter = persona.sectors[0].value

    similar = retrieve_similar_events(
        text=event_text,
        top_k=top_k,
        sector_filter=sector_filter,
    )

    if len(similar) < 2 and sector_filter:
        similar = retrieve_similar_events(text=event_text, top_k=top_k)

    if not similar:
        return HistoryEchoResult(
            parallels=[],
            avg_sector_move_pct=0.0,
            echo_summary="No historical parallels found."
        )

    parallels: List[HistoricalParallel] = []
    all_nifty_changes: List[float] = []

    for past in similar:
        metadata = past["metadata"]
        sector = metadata.get("primary_sector", "unknown")
        date = metadata.get("date", "unknown")

        price_changes = {}
        for asset in TRACKED_ASSETS:
            pct = get_asset_impact_from_metadata(metadata, asset, timeframe)
            if pct != 0:
                price_changes[asset.replace("_", " ")] = pct

        portfolio_gain = None
        if persona:
            portfolio_val = persona.portfolio_value or 0
            if portfolio_val > 0:
                nifty_change = get_asset_impact_from_metadata(metadata, "Nifty_50", timeframe)
                if nifty_change != 0:
                    portfolio_gain = round(portfolio_val * (nifty_change / 100), 0)

        parallels.append(HistoricalParallel(
            event_date=date,
            event_summary=past["text"][:120] + "...",
            sector=sector,
            similarity_score=past["similarity_score"],
            price_changes=price_changes,
            portfolio_gain_inr=portfolio_gain
        ))

        nifty_change = get_asset_impact_from_metadata(metadata, "Nifty_50", timeframe)
        if nifty_change != 0:
            all_nifty_changes.append(nifty_change)

    avg_move = round(sum(all_nifty_changes) / len(all_nifty_changes), 1) if all_nifty_changes else 0.0
    direction = "gain" if avg_move > 0 else "decline" if avg_move < 0 else "flat"
    summary = f"Historical echo: {len(parallels)} similar events → Nifty {direction} avg {abs(avg_move)}% in {timeframe}"

    return HistoryEchoResult(
        parallels=parallels,
        avg_sector_move_pct=avg_move,
        echo_summary=summary
    )