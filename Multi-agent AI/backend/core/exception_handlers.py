import sys
from pathlib import Path
from typing import Union

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from core.exceptions import (
    IPCAException,
    LLMAPIError,
    LLMAuthenticationError,
    LLMQuotaExceededError,
    AgentDataValidationError,
    LLMTimeoutError,
    WorkflowExecutionError
)


def register_exception_handlers(app: FastAPI):
    """Register custom exception handlers covering all 5 failure scenarios."""

    # -------------------------------------------------------------
    # Scenario 5: FastAPI receives incorrect input (Validation Error)
    # -------------------------------------------------------------
    @app.exception_handler(RequestValidationError)
    def validation_exception_handler(request: Request, exc: RequestValidationError):
        formatted_errors = []
        for err in exc.errors():
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "message": err.get("msg", "Invalid value"),
                "type": err.get("type", "validation_error")
            })

        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "error_code": "INVALID_REQUEST_INPUT",
                "message": "Input validation failed. Please check the submitted fields.",
                "details": formatted_errors
            }
        )

    # -------------------------------------------------------------
    # Scenarios 1, 2, 3, 4: Custom IPCA Exceptions
    # -------------------------------------------------------------
    @app.exception_handler(IPCAException)
    def ipca_exception_handler(request: Request, exc: IPCAException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error_code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )

    # -------------------------------------------------------------
    # Standard HTTP Exceptions (e.g. 404 Not Found, 403 Forbidden)
    # -------------------------------------------------------------
    @app.exception_handler(StarletteHTTPException)
    def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error_code": f"HTTP_{exc.status_code}",
                "message": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
                "details": exc.detail if isinstance(exc.detail, dict) else {}
            }
        )

    # -------------------------------------------------------------
    # Fallback Catch-All for Unexpected Internal Server Errors
    # -------------------------------------------------------------
    @app.exception_handler(Exception)
    def unhandled_exception_handler(request: Request, exc: Exception):
        print(f"[UNHANDLED EXCEPTION]: {type(exc).__name__}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error_code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later.",
                "details": {"error_type": type(exc).__name__, "error_message": str(exc)}
            }
        )

