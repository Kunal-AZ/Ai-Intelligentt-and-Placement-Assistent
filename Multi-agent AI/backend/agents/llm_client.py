import os
import sys
import re
import json
from pathlib import Path
from typing import Type, TypeVar, Optional, List, Tuple
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
import httpx

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# The repository root .env is the single runtime configuration source.
load_dotenv(dotenv_path=backend_dir.parents[1] / ".env")

from core.exceptions import (
    IPCAException,
    LLMAPIError,
    LLMAuthenticationError,
    LLMQuotaExceededError,
    AgentDataValidationError,
    LLMTimeoutError
)

# Backward-compatible alias
GeminiAPIError = LLMAPIError

T = TypeVar("T", bound=BaseModel)

# Cache resolved model to avoid repeated discovery calls
_RESOLVED_MODEL: Optional[str] = None
_RESOLVED_API_VERSION: Optional[str] = None

# Production timeout config (Scenario 3: Agent timeout prevention)
REQUEST_TIMEOUT = httpx.Timeout(connect=5.0, read=45.0, write=10.0, pool=5.0)


def clean_json_text(text: str) -> str:
    """Strip markdown code blocks or surrounding text to isolate raw JSON."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return text.strip()


def get_available_models(api_key: str) -> List[dict]:
    """Fetch all models supporting generateContent for this API key."""
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }
    
    for version in ("v1beta", "v1"):
        try:
            url = f"https://generativelanguage.googleapis.com/{version}/models"
            with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
                resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("models", [])
                valid_models = []
                for m in models:
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        clean_name = m.get("name", "").replace("models/", "")
                        valid_models.append({
                            "name": clean_name,
                            "version": version
                        })
                if valid_models:
                    return valid_models
        except Exception:
            continue
    return []


def call_gemini(
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    agent_name: str = "AI Agent"
) -> T:
    """
    Call Google Gemini API with automatic candidate model failover and parse structured JSON.
    Catches and handles:
    - Scenario 1: LLM API failures (Connection, Auth, Quota, Server errors)
    - Scenario 2: Agent invalid/malformed response data
    - Scenario 3: Request timeouts
    """
    global _RESOLVED_MODEL, _RESOLVED_API_VERSION

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise LLMAuthenticationError("GEMINI_API_KEY is not configured in the root .env file")

    configured_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()

    schema_json = json.dumps(response_model.model_json_schema(), indent=2)
    full_system_prompt = (
        f"{system_prompt}\n\n"
        f"You must strictly output a valid JSON object matching this schema:\n"
        f"{schema_json}"
    )

    payload = {
        "system_instruction": {
            "parts": [{"text": full_system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json"
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key
    }

    def _execute_request(m_name: str, ver: str):
        url = f"https://generativelanguage.googleapis.com/{ver}/models/{m_name}:generateContent"
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            return client.post(url, json=payload, headers=headers)

    # Build prioritized candidate list of (model_name, version)
    raw_candidates: List[Tuple[str, str]] = []

    if _RESOLVED_MODEL and _RESOLVED_API_VERSION:
        raw_candidates.append((_RESOLVED_MODEL, _RESOLVED_API_VERSION))

    if configured_model:
        raw_candidates.append((configured_model, "v1beta"))

    # Use at most one alternative for a missing or overloaded model. Never
    # rotate models after authentication/quota errors or connection failures.
    fallback_model = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-flash-lite-latest").strip()
    if fallback_model:
        raw_candidates.append((fallback_model, "v1beta"))

    # Deduplicate while preserving order
    candidates: List[Tuple[str, str]] = []
    seen = set()
    for item in raw_candidates:
        if item not in seen:
            seen.add(item)
            candidates.append(item)

    resp = None
    successful_model = None
    successful_ver = None
    timed_out = False

    for model_name, ver in candidates[:2]:
        try:
            r = _execute_request(model_name, ver)
            resp = r
            successful_model = model_name
            successful_ver = ver
            if r.status_code in (404, 502, 503, 504):
                continue
            break
        except httpx.ReadTimeout:
            # An overloaded model can accept the connection but never produce
            # a response. Allow the same single fallback as for HTTP 503.
            # The two-candidate limit bounds total generation wait to 90s.
            resp = None
            timed_out = True
            continue
        except httpx.TimeoutException:
            timed_out = True
            break
        except Exception:
            # Transport failures are likewise independent of the selected
            # model. Keep a 404-only fallback for invalid model aliases.
            break

    # Scenario 1 & 3: If no candidates responded
    if resp is None:
        if timed_out:
            raise LLMTimeoutError(
                f"{agent_name} exceeded the provider response timeout.",
                timeout_seconds=REQUEST_TIMEOUT.read
            )
        raise LLMAPIError(
            f"None of the available Gemini models responded. Please check API key permissions or internet connection.",
            status_code=502
        )

    # Cache successful model for subsequent calls
    if resp.status_code == 200:
        _RESOLVED_MODEL = successful_model
        _RESOLVED_API_VERSION = successful_ver

    # Scenario 1: HTTP Error handling from Gemini
    if resp.status_code != 200:
        try:
            err_data = resp.json()
            err_msg = err_data.get("error", {}).get("message", resp.text)
            err_status = resp.status_code
        except Exception:
            err_msg = resp.text
            err_status = resp.status_code

        if err_status in (401, 403):
            raise LLMAuthenticationError(f"Gemini authentication failed: {err_msg}")
        elif err_status == 429:
            raise LLMQuotaExceededError(f"Gemini quota or rate limit exceeded: {err_msg}")
        elif err_status >= 500:
            raise LLMAPIError(f"Gemini server error ({err_status}): {err_msg}", status_code=502)
        else:
            raise LLMAPIError(f"Gemini API returned error ({err_status}) on {successful_model}: {err_msg}", status_code=err_status)

    # Parse response content
    try:
        data = resp.json()
        candidates_list = data.get("candidates", [])
        if not candidates_list:
            raise AgentDataValidationError("Gemini response contained no candidates.", agent_name=agent_name)

        content_parts = candidates_list[0].get("content", {}).get("parts", [])
        if not content_parts or "text" not in content_parts[0]:
            raise AgentDataValidationError("Gemini response missing text part.", agent_name=agent_name)

        raw_text = content_parts[0]["text"]
        cleaned_json = clean_json_text(raw_text)

        # Scenario 2: Validate against Pydantic schema
        return response_model.model_validate_json(cleaned_json)

    except (ValidationError, json.JSONDecodeError) as val_err:
        raise AgentDataValidationError(
            f"{agent_name} produced invalid or malformed data: {str(val_err)}",
            agent_name=agent_name,
            raw_output=raw_text if 'raw_text' in locals() else None
        )
    except AgentDataValidationError:
        raise
    except Exception as e:
        raise AgentDataValidationError(f"Failed to process {agent_name} output: {str(e)}", agent_name=agent_name)
