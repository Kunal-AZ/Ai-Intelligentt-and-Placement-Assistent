import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from core.exceptions import (
    IPCAException,
    LLMAPIError,
    LLMAuthenticationError,
    LLMQuotaExceededError,
    AgentDataValidationError,
    LLMTimeoutError,
    WorkflowExecutionError
)

# Aliases for unified application-wide exception handling
IPCAError = IPCAException
AgentExecutionError = AgentDataValidationError
ResumeAnalysisError = AgentDataValidationError
OpenAIServiceError = LLMAPIError
