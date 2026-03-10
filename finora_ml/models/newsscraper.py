import hashlib, json, logging, re, time
from datetime import datetime
from urllib.parse import urljoin
import feedparser, requests
from bs4 import BeautifulSoup

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("finora")

def _get_session():
    s = requests.Session()
    s.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"})
    return s

def _clean(t): return re.sub(r"\s+", " ", t).strip()

SOURCES = {
    "Economic Times": {
        "rss": ["https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms"],
        "scrape": ["https://economictimes.indiatimes.com/markets/stocks/news"],
        "links": ["h3 a", ".eachStory a"]
    },
    "Moneycontrol": {
        "rss": ["https://www.moneycontrol.com/rss/MCtopnews.xml"],
        "scrape": ["https://www.moneycontrol.com/news/business/markets/"]
    },
    "Reuters India": {
        "rss": ["https://www.reutersagency.com/feed/?best-topics=business&region=india"],
    },
    "Business Standard": {
        "rss": ["https://www.business-standard.com/rss/latest.rss"]
    }
}

def get_financial_news(target_count=45):
    session = _get_session()
    final_data = []
    seen_urls = set()

    for name, cfg in SOURCES.items():
        logger.info(f"Fetching {name}...")
        for rss_url in cfg.get("rss", []):
            feed = feedparser.parse(rss_url)
            for entry in feed.entries:
                link = entry.get("link")
                if link and link not in seen_urls:
                    seen_urls.add(link)
                    summary = BeautifulSoup(entry.get("summary", ""), "html.parser").get_text()
                    final_data.append({
                        "source": name,
                        "title": _clean(entry.get("title", "No Title")),
                        "summary": _clean(summary)[:300],
                        "url": link,
                        "timestamp": datetime.now().isoformat()
                    })

        if len(final_data) < target_count and "scrape" in cfg:
            for s_url in cfg["scrape"]:
                try:
                    res = session.get(s_url, timeout=15)
                    soup = BeautifulSoup(res.text, "html.parser")
                    for link_tag in soup.select(", ".join(cfg.get("links", ["h3 a", "h2 a"])))[:15]:
                        full_link = urljoin(s_url, link_tag.get("href"))
                        if full_link not in seen_urls:
                            seen_urls.add(full_link)
                            final_data.append({
                                "source": name,
                                "title": _clean(link_tag.get_text()),
                                "summary": "Full text available for AI analysis",
                                "url": full_link,
                                "timestamp": datetime.now().isoformat()
                            })
                    time.sleep(1) # Polite delay
                except: continue

    return final_data[:target_count]

if __name__ == "__main__":
    news = get_financial_news(target_count=40)
    print(json.dumps(news, indent=2))