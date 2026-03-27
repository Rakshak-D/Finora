from dataclasses import dataclass
import os


@dataclass
class DatabaseConfig:
    url: str = os.getenv("DATABASE_URL", "")
    redis_url: str = os.getenv("REDIS_URL", "")

    @property
    def configured(self) -> bool:
        return bool(self.url)


db_config = DatabaseConfig()
