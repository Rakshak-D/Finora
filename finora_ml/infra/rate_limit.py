from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timedelta

from fastapi import Request, status

from finora_ml.infra.http import get_client_ip, raise_api_error


class InMemoryRateLimiter:
    def __init__(self):
        self._hits: dict[str, deque[datetime]] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> None:
        now = datetime.utcnow()
        window_start = now - timedelta(seconds=window_seconds)
        bucket = self._hits[key]
        while bucket and bucket[0] < window_start:
            bucket.popleft()
        if len(bucket) >= limit:
            raise_api_error(
                status.HTTP_429_TOO_MANY_REQUESTS,
                "rate_limited",
                "Too many requests. Please slow down and try again shortly.",
                {"limit": limit, "window_seconds": window_seconds},
            )
        bucket.append(now)


rate_limiter = InMemoryRateLimiter()


def enforce_rate_limit(request: Request, *, scope: str, limit: int, window_seconds: int) -> None:
    client_ip = get_client_ip(request)
    route_key = f"{scope}:{client_ip}"
    rate_limiter.check(route_key, limit=limit, window_seconds=window_seconds)
