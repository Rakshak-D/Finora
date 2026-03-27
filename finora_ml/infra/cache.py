from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Generic, Optional, TypeVar

T = TypeVar("T")


class TTLCache(Generic[T]):
    def __init__(self, ttl_seconds: int = 60):
        self.ttl = timedelta(seconds=ttl_seconds)
        self._values: Dict[str, tuple[datetime, T]] = {}

    def get(self, key: str) -> Optional[T]:
        record = self._values.get(key)
        if not record:
            return None
        created_at, value = record
        if datetime.utcnow() - created_at > self.ttl:
            self._values.pop(key, None)
            return None
        return value

    def set(self, key: str, value: T) -> T:
        self._values[key] = (datetime.utcnow(), value)
        return value
