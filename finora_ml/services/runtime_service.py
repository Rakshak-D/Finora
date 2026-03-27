from __future__ import annotations

from datetime import datetime

import finora_ml.config as cfg
from finora_ml.models.classifier import get_classifier_status
from finora_ml.models.embeddings import get_embedding_status, get_vector_store_status
from finora_ml.models.sentiment import get_sentiment_status
from finora_ml.schemas import RuntimeComponentStatus, SystemStatusResponse


class RuntimeService:
    def get_status(self) -> SystemStatusResponse:
        sentiment = get_sentiment_status()
        classifier = get_classifier_status()
        embeddings = get_embedding_status()
        vector_store = get_vector_store_status()

        components = [
            RuntimeComponentStatus(
                name="sentiment",
                provider=sentiment.get("provider", "unknown"),
                ready=bool(sentiment.get("ready")),
                using_gpu=bool(sentiment.get("using_gpu")),
                detail=sentiment.get("error") or None,
            ),
            RuntimeComponentStatus(
                name="classification",
                provider=classifier.get("provider", "unknown"),
                ready=bool(classifier.get("ready")),
                using_gpu=bool(classifier.get("using_gpu")),
                detail=classifier.get("error") or None,
            ),
            RuntimeComponentStatus(
                name="embeddings",
                provider=embeddings.get("provider", "unknown"),
                ready=bool(embeddings.get("ready")),
                using_gpu=bool(embeddings.get("using_gpu")),
                detail=embeddings.get("error") or None,
            ),
            RuntimeComponentStatus(
                name="vector_store",
                provider=vector_store.get("provider", "unknown"),
                ready=bool(vector_store.get("ready")),
                using_gpu=False,
                detail=vector_store.get("error") or None,
            ),
        ]

        model_components = [component for component in components if component.name != "vector_store"]
        pipeline_ready = all(component.ready for component in model_components)

        return SystemStatusResponse(
            api_status="ok",
            pipeline_ready=pipeline_ready,
            gpu_enabled=cfg.ENABLE_GPU,
            gpu_device=cfg.CUDA_DEVICE_NAME or None,
            cuda_available=cfg.CUDA_VISIBLE,
            vector_store_ready=bool(vector_store.get("ready")),
            models=components,
            last_updated=datetime.utcnow().isoformat(),
        )


runtime_service = RuntimeService()
