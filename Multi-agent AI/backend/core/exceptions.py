from typing import Optional, Dict, Any


class IPCAException(Exception):
    """Base exception class for all IPCA application errors."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


# =======================================================
# Scenario 1: LLM API Fails (Connection, Auth, Quota, 5xx)
# =======================================================

class LLMAPIError(IPCAException):
    """Raised when external LLM API (Gemini / OpenAI) fails."""
    def __init__(
        self,
        message: str,
        status_code: int = 502,
        error_code: str = "LLM_API_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, status_code=status_code, error_code=error_code, details=details)


class LLMAuthenticationError(LLMAPIError):
    def __init__(self, message: str = "AI authentication failed. Invalid API key.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=401, error_code="LLM_AUTH_FAILED", details=details)


class LLMQuotaExceededError(LLMAPIError):
    def __init__(self, message: str = "AI quota or rate limit exceeded. Please check credits.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=429, error_code="LLM_QUOTA_EXCEEDED", details=details)


# =======================================================
# Scenario 2: Agent Returns Invalid Data / Schema Mismatch
# =======================================================

class AgentDataValidationError(IPCAException):
    """Raised when an AI agent produces malformed or unparseable output."""
    def __init__(
        self,
        message: str,
        agent_name: str = "Unknown Agent",
        raw_output: Optional[str] = None
    ):
        super().__init__(
            message=message,
            status_code=502,
            error_code="INVALID_AGENT_DATA",
            details={
                "agent": agent_name,
                "raw_preview": raw_output[:300] if raw_output else None
            }
        )


# =======================================================
# Scenario 3: One Agent Takes Too Long (Timeout Handling)
# =======================================================

class LLMTimeoutError(LLMAPIError):
    """Raised when an agent or external API request exceeds its time limit."""
    def __init__(
        self,
        message: str = "AI agent request timed out.",
        timeout_seconds: Optional[float] = None
    ):
        super().__init__(
            message=message,
            status_code=504,
            error_code="AGENT_TIMEOUT",
            details={"timeout_seconds": timeout_seconds} if timeout_seconds else {}
        )


# =======================================================
# Scenario 4: LangGraph Workflow Crashes / Node Failures
# =======================================================

class WorkflowExecutionError(IPCAException):
    """Raised when a LangGraph workflow execution fails."""
    def __init__(
        self,
        message: str,
        failed_node: Optional[str] = None,
        partial_state: Optional[Dict[str, Any]] = None
    ):
        super().__init__(
            message=message,
            status_code=500,
            error_code="WORKFLOW_EXECUTION_ERROR",
            details={
                "failed_node": failed_node,
                "partial_state": partial_state
            }
        )

