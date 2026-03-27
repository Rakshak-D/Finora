from __future__ import annotations

import hashlib
import logging
from datetime import datetime
from urllib.parse import urljoin

import feedparser
import requests
from bs4 import BeautifulSoup

from finora_ml.schemas import NewsArticle

logger = logging.getLogger(__name__)

SOURCES = {
    "Economic Times": {
        "rss": ["https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"],
        "scrape": ["https://economictimes.indiatimes.com/markets/stocks/news"],
        "links": ["h3 a", ".eachStory a"],
    },
    "Moneycontrol": {
        "rss": ["https://www.moneycontrol.com/rss/MCtopnews.xml"],
        "scrape": ["https://www.moneycontrol.com/news/business/markets/"],
        "links": ["h2 a", "li.clearfix a"],
    },
    "Business Standard": {
        "rss": ["https://www.business-standard.com/rss/latest.rss"],
        "links": ["h2 a"],
    },
    "Reuters India": {
        "rss": ["https://www.reutersagency.com/feed/?best-topics=business&region=india"],
        "links": ["article a"],
    },
}


class RssNewsProvider:
    provider_name = "rss"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36"}
        )

    def _hash_id(self, value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]

    def _clean(self, value: str) -> str:
        return " ".join(value.split())

    def _source_quality(self, source: str) -> str:
        if source in {"Reuters India", "Economic Times", "Business Standard"}:
            return "high"
        return "medium"

    def list_live_news(self, limit: int = 12) -> list[NewsArticle]:
        items: list[NewsArticle] = []
        seen_urls: set[str] = set()

        for source_name, config in SOURCES.items():
            for rss_url in config.get("rss", []):
                feed = feedparser.parse(rss_url)
                if getattr(feed, "bozo", 0):
                    logger.warning("RSS feed parsing issue for %s from %s", source_name, rss_url)
                for entry in feed.entries:
                    link = entry.get("link")
                    if not link or link in seen_urls:
                        continue
                    seen_urls.add(link)
                    summary = BeautifulSoup(entry.get("summary", ""), "html.parser").get_text(" ", strip=True)
                    published = entry.get("published") or entry.get("updated") or datetime.utcnow().isoformat()
                    items.append(
                        NewsArticle(
                            id=self._hash_id(link),
                            title=self._clean(entry.get("title", "Untitled")),
                            source=source_name,
                            url=link,
                            published_at=published,
                            fetched_at=datetime.utcnow().isoformat(),
                            summary=self._clean(summary)[:320],
                            source_quality=self._source_quality(source_name),
                        )
                    )
                    if len(items) >= limit:
                        return items

            for scrape_url in config.get("scrape", []):
                try:
                    response = self.session.get(scrape_url, timeout=10)
                    response.raise_for_status()
                    soup = BeautifulSoup(response.text, "html.parser")
                    selectors = ", ".join(config.get("links", ["h3 a"]))
                    for anchor in soup.select(selectors):
                        title = self._clean(anchor.get_text(" ", strip=True))
                        link = urljoin(scrape_url, anchor.get("href", ""))
                        if not title or not link or link in seen_urls:
                            continue
                        seen_urls.add(link)
                        items.append(
                            NewsArticle(
                                id=self._hash_id(link),
                                title=title,
                                source=source_name,
                                url=link,
                                published_at=datetime.utcnow().isoformat(),
                                fetched_at=datetime.utcnow().isoformat(),
                                summary="Full text available from source. Hover to generate a coach summary.",
                                source_quality=self._source_quality(source_name),
                            )
                        )
                        if len(items) >= limit:
                            return items
                except Exception as exc:
                    logger.warning("News scrape failed for %s from %s: %s", source_name, scrape_url, exc)
                    continue

        return items[:limit]
