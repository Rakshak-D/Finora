from __future__ import annotations

from typing import Dict, Optional

from finora_ml.schemas import NewsInsight


class InsightRepository:
    def __init__(self):
        self._insights: Dict[str, NewsInsight] = {}

    def get(self, key: str) -> Optional[NewsInsight]:
        return self._insights.get(key)

    def set(self, key: str, insight: NewsInsight) -> NewsInsight:
        self._insights[key] = insight
        return insight


insight_repository = InsightRepository()
