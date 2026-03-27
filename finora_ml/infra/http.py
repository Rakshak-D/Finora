from __future__ import annotations

from math import ceil

from fastapi import HTTPException, Request, status

from finora_ml.schemas import ErrorDetail, ErrorResponse, PaginationMeta


def build_error_response(code: str, message: str, details=None) -> ErrorResponse:
    return ErrorResponse(error=ErrorDetail(code=code, message=message, details=details))


def raise_api_error(status_code: int, code: str, message: str, details=None) -> None:
    raise HTTPException(
        status_code=status_code,
        detail=build_error_response(code=code, message=message, details=details).model_dump()["error"],
    )


def build_pagination_meta(page: int, page_size: int, total_items: int) -> PaginationMeta:
    total_pages = max(1, ceil(total_items / page_size)) if page_size else 1
    safe_page = min(max(1, page), total_pages)
    return PaginationMeta(
        page=safe_page,
        page_size=page_size,
        total_items=total_items,
        total_pages=total_pages,
        has_next=safe_page < total_pages,
        has_previous=safe_page > 1,
    )


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    if forwarded_for:
        return forwarded_for
    if request.client and request.client.host:
        return request.client.host
    return "anonymous"


def sanitize_text_input(value: str, *, min_length: int = 1, max_length: int = 800, field_name: str = "text") -> str:
    cleaned = " ".join((value or "").replace("\x00", " ").split())
    if len(cleaned) < min_length:
        raise_api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "validation_error",
            f"{field_name} must be at least {min_length} characters.",
        )
    if len(cleaned) > max_length:
        raise_api_error(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "validation_error",
            f"{field_name} must be {max_length} characters or fewer.",
        )
    return cleaned
