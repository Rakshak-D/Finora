from __future__ import annotations

from typing import Dict, Iterable, Optional

from finora_ml.schemas import NewsArticle


class ArticleRepository:
    def __init__(self):
        self._articles: Dict[str, NewsArticle] = {}

    def upsert_many(self, articles: Iterable[NewsArticle]) -> None:
        for article in articles:
            self._articles[article.id] = article

    def get(self, article_id: str) -> Optional[NewsArticle]:
        return self._articles.get(article_id)


article_repository = ArticleRepository()
