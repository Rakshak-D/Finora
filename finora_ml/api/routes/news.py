from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Query, Request

import finora_ml.config as cfg
from finora_ml.infra.http import build_pagination_meta, raise_api_error
from finora_ml.infra.rate_limit import enforce_rate_limit
from finora_ml.schemas import PaginatedNewsResponse, NewsArticle, NewsInsight, NewsInsightRequest, NewsResponse
from finora_ml.services.news_intelligence_service import news_intelligence_service

router = APIRouter()


@router.get("/api/news", response_model=List[NewsResponse])
def get_legacy_news(count: int = cfg.NEWS_DEFAULT_COUNT):
    articles = news_intelligence_service.list_live_news(limit=max(1, min(count, 30)))
    return [
        NewsResponse(
            source=article.source,
            title=article.title,
            summary=article.summary,
            url=article.url,
            timestamp=article.published_at or article.fetched_at,
        )
        for article in articles
    ]


@router.get("/api/news/live", response_model=PaginatedNewsResponse)
def get_live_news(
    page: int = Query(1, ge=1),
    page_size: int = Query(cfg.NEWS_DEFAULT_COUNT, ge=1, le=30),
    count: Optional[int] = Query(None, ge=1, le=30),
    q: Optional[str] = Query(None, min_length=1, max_length=100),
    sort: str = Query("latest", pattern="^(latest|urgency|source)$"),
):
    articles = news_intelligence_service.list_live_news(limit=30)
    search = (q or "").strip().lower()
    if search:
        articles = [
            article
            for article in articles
            if search in article.title.lower()
            or search in article.summary.lower()
            or search in article.source.lower()
            or any(search in entity.lower() for entity in article.entities)
        ]

    if sort == "urgency":
        urgency_order = {"high": 0, "medium": 1, "low": 2}
        articles = sorted(articles, key=lambda item: (urgency_order.get(item.urgency, 3), -(datetime.fromisoformat(item.fetched_at).timestamp())))
    elif sort == "source":
        articles = sorted(articles, key=lambda item: (item.source.lower(), -(datetime.fromisoformat(item.fetched_at).timestamp())))
    else:
        articles = sorted(articles, key=lambda item: item.fetched_at, reverse=True)

    effective_page_size = count or page_size
    meta = build_pagination_meta(page=page, page_size=effective_page_size, total_items=len(articles))
    start = (meta.page - 1) * meta.page_size
    end = start + meta.page_size
    return PaginatedNewsResponse(
        items=articles[start:end],
        meta=meta,
        last_updated=datetime.utcnow().isoformat(),
    )


@router.post("/api/news/insight", response_model=NewsInsight)
def get_news_insight(body: NewsInsightRequest, request: Request):
    enforce_rate_limit(request, scope="news_insight", limit=18, window_seconds=60)
    try:
        return news_intelligence_service.build_insight(body)
    except ValueError as exc:
        raise_api_error(404, "news_insight_not_found", str(exc))
    except Exception as exc:
        raise_api_error(500, "news_insight_failed", "Failed to generate article insight", str(exc))
