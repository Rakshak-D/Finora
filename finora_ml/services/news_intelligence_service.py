from __future__ import annotations

import hashlib
from datetime import datetime
from typing import List

from finora_ml.infra.cache import TTLCache
from finora_ml.pipeline import run_event_pipeline
from finora_ml.providers.news.rss_provider import RssNewsProvider
from finora_ml.repositories.analyses import insight_repository
from finora_ml.repositories.articles import article_repository
from finora_ml.schemas import EventInput, HistoricalParallelInsight, NewsArticle, NewsInsight, NewsInsightRequest
from finora_ml.services.coach_service import coach_service


class NewsIntelligenceService:
    def __init__(self):
        self.provider = RssNewsProvider()
        self.live_cache = TTLCache[List[NewsArticle]](ttl_seconds=90)
        self.insight_cache = TTLCache[NewsInsight](ttl_seconds=300)

    def _infer_urgency(self, title: str) -> str:
        lower = title.lower()
        if any(word in lower for word in ("crash", "war", "rbi", "budget", "tariff", "surge", "selloff")):
            return "high"
        if any(word in lower for word in ("earnings", "policy", "inflation", "oil", "rupee")):
            return "medium"
        return "low"

    def _extract_entities(self, article: NewsArticle) -> list[str]:
        entities = []
        text = f"{article.title} {article.summary}".lower()
        for sector in ("banking", "it", "energy", "pharma", "auto", "infra", "fmcg", "metals", "realestate", "defence"):
            if sector in text:
                entities.append(sector)
        if "rbi" in text:
            entities.append("RBI")
        if "nifty" in text:
            entities.append("Nifty 50")
        if "rupee" in text or "usd/inr" in text:
            entities.append("USD/INR")
        return entities

    def _decorate_article(self, article: NewsArticle) -> NewsArticle:
        article.urgency = self._infer_urgency(article.title)
        article.entities = self._extract_entities(article)
        article.one_line_take = (
            f"{article.source} is reporting a market-moving story that may affect {article.entities[0] if article.entities else 'Indian equities'}."
        )
        article.beginner_summary = (
            f"In plain English: {article.summary or article.title}. Hover or open the story to see which assets may react first."
        )
        return article

    def list_live_news(self, limit: int = 12) -> List[NewsArticle]:
        cache_key = f"live:{limit}"
        cached = self.live_cache.get(cache_key)
        if cached is not None:
            return cached

        articles = [self._decorate_article(article) for article in self.provider.list_live_news(limit)]
        article_repository.upsert_many(articles)
        return self.live_cache.set(cache_key, articles)

    def build_insight(self, request: NewsInsightRequest) -> NewsInsight:
        if request.article_id:
            article = article_repository.get(request.article_id)
            if not article:
                self.list_live_news(limit=15)
                article = article_repository.get(request.article_id)
            if not article:
                raise ValueError("Article not found")
            headline = article.title
            body_text = f"{article.title}. {article.summary}"
            source_name = article.source
            source_url = article.url
        else:
            headline = request.title or request.text or request.url or "Untitled story"
            body_text = request.text or request.title or request.url or ""
            source_name = "Finora"
            source_url = request.url

        insight_id = hashlib.sha256(body_text.encode("utf-8")).hexdigest()[:16]
        cached = self.insight_cache.get(insight_id) or insight_repository.get(insight_id)
        if cached:
            return cached

        analysis = run_event_pipeline(
            event=EventInput(text=body_text, deep_analysis=True),
            persona=request.persona,
            run_history=True,
            run_gemini=True,
        )
        parallels = [
            HistoricalParallelInsight(
                title=f"{parallel.event_date} • {parallel.sector.upper()}",
                outcome=parallel.event_summary,
                similarity=round(parallel.similarity_score, 2),
            )
            for parallel in ((analysis.history_echo.parallels if analysis.history_echo else []) or [])[:3]
        ]

        insight = NewsInsight(
            id=insight_id,
            headline=headline,
            source_name=source_name,
            source_url=source_url,
            one_line_take=coach_service.build_one_line_take(headline, analysis),
            beginner_summary=coach_service.build_beginner_summary(analysis),
            should_care=coach_service.compute_should_care(analysis.signal_score),
            confidence=round((analysis.signal_score or 0.0) * 100.0, 1),
            urgency=self._infer_urgency(headline),
            historical_parallels=parallels,
            graph=coach_service.build_graph(headline, analysis),
            coach_brief=coach_service.build_brief(headline, analysis),
            analysis=analysis,
            generated_at=datetime.utcnow().isoformat(),
        )
        insight_repository.set(insight_id, insight)
        self.insight_cache.set(insight_id, insight)
        return insight


news_intelligence_service = NewsIntelligenceService()
