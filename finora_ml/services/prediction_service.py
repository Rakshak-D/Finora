from __future__ import annotations

from datetime import datetime

from finora_ml.schemas import AssetPrediction, PredictionOverviewResponse, SectorPrediction
from finora_ml.services.market_service import market_service


def _forecast_bias(change_percent: float | None) -> str:
    change = change_percent or 0.0
    if change >= 0.8:
        return "bullish"
    if change <= -0.8:
        return "bearish"
    return "balanced"


def _project_change(change_percent: float | None, sparkline: list[float]) -> float:
    current_change = change_percent or 0.0
    if len(sparkline) >= 2 and sparkline[0]:
        momentum = ((sparkline[-1] - sparkline[0]) / sparkline[0]) * 100
    else:
        momentum = current_change
    return round((current_change * 0.55) + (momentum * 0.45), 2)


def _prediction_confidence(change_percent: float | None, sparkline: list[float]) -> int:
    volatility_anchor = abs(change_percent or 0.0)
    path_strength = abs((sparkline[-1] - sparkline[0]) / sparkline[0]) * 100 if len(sparkline) >= 2 and sparkline[0] else 0.0
    return int(max(52, min(92, 58 + volatility_anchor * 6 + path_strength * 1.5)))


class PredictionService:
    def get_overview(self) -> PredictionOverviewResponse:
        market_snapshot = market_service.get_market_snapshot()
        sector_snapshot = market_service.get_sector_snapshot()

        asset_predictions: list[AssetPrediction] = []
        for instrument in market_snapshot.instruments[:6]:
            projected_change = _project_change(instrument.change_percent, instrument.sparkline)
            current_price = instrument.price
            predicted_price = None
            if current_price is not None:
                predicted_price = round(current_price * (1 + projected_change / 100), 2)

            asset_predictions.append(
                AssetPrediction(
                    instrument_id=instrument.id,
                    display_name=instrument.display_name,
                    symbol=instrument.symbol,
                    current_price=current_price,
                    predicted_price=predicted_price,
                    current_change_percent=instrument.change_percent,
                    projected_change_percent=projected_change,
                    trend="up" if projected_change > 0 else "down" if projected_change < 0 else "flat",
                    confidence=_prediction_confidence(instrument.change_percent, instrument.sparkline),
                    rationale=(
                        "Live momentum, recent price path, and session change are aligned."
                        if abs(projected_change) >= 0.75
                        else "Momentum is mixed, so Finora is treating the next move as balanced."
                    ),
                )
            )

        sector_predictions = [
            SectorPrediction(
                key=sector.key,
                name=sector.name,
                current_change_percent=sector.change_percent,
                forecast_bias=_forecast_bias(sector.change_percent),
                horizon="Next 1-3 sessions",
                confidence=int(max(50, min(88, 56 + abs(sector.change_percent or 0.0) * 10))),
                rationale=(
                    "Sector breadth proxy is trending higher."
                    if (sector.change_percent or 0.0) > 0.75
                    else "Sector breadth proxy is under pressure."
                    if (sector.change_percent or 0.0) < -0.75
                    else "Sector breadth is currently range-bound."
                ),
            )
            for sector in sector_snapshot.sectors[:6]
        ]

        leaders = [prediction.display_name for prediction in asset_predictions[:3]]
        summary = (
            f"Finora is tracking {len(asset_predictions)} live assets and {len(sector_predictions)} sector proxies. "
            f"Current momentum leaders: {', '.join(leaders) if leaders else 'no leaders yet'}."
        )

        return PredictionOverviewResponse(
            summary=summary,
            assets=asset_predictions,
            sectors=sector_predictions,
            last_updated=datetime.utcnow().isoformat(),
        )


prediction_service = PredictionService()
