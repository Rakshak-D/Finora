from fastapi import APIRouter

from finora_ml.schemas import PredictionOverviewResponse
from finora_ml.services.prediction_service import prediction_service

router = APIRouter()


@router.get("/api/predictions/overview", response_model=PredictionOverviewResponse)
def get_predictions_overview():
    return prediction_service.get_overview()
