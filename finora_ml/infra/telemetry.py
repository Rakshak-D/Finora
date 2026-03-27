import logging
from typing import Any


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def log_structured(logger: logging.Logger, message: str, **fields: Any) -> None:
    if fields:
        logger.info("%s | %s", message, fields)
        return
    logger.info(message)
