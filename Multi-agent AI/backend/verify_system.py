import sys
import asyncio
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from core.exceptions import (
    IPCAException,
    LLMAPIError,
    LLMAuthenticationError,
    LLMQuotaExceededError,
    AgentDataValidationError,
    LLMTimeoutError,
    WorkflowExecutionError
)
from core.exception_handlers import register_exception_handlers
from workflow.graph import ipca_graph
from schemas.api_schema import IPCARequest
from schemas.api_response import IPCAResponse
from main import app

def test_all():
    print("1. Checking routes on main app:")
    all_routes = []
    for r in app.routes:
        if hasattr(r, "path"):
            all_routes.append(r.path)
        elif hasattr(r, "original_router"):
            for sub_r in r.original_router.routes:
                if hasattr(sub_r, "path"):
                    all_routes.append(sub_r.path)
    print(f"Total routes: {len(all_routes)}")
    print("Found routes:", all_routes)
    assert "/api/v1/ipca/analyze" in all_routes
    assert "/api/v1/ipca/state/{thread_id}" in all_routes
    assert "/api/v1/ipca/history/{student_id}" in all_routes
    assert "/api/v1/ipca/result/{analysis_id}" in all_routes
    assert "/run-workflow" in all_routes
    assert "/analyze-resume" in all_routes
    assert "/analyze-skills" in all_routes
    assert "/generate-interview-questions" in all_routes
    assert "/evaluate-interview-answer" in all_routes
    assert "/recommend-career" in all_routes
    assert "/health" in all_routes
    assert "/" in all_routes
    print("   All expected routes exist!")

    print("\n2. Checking LangGraph structure:")
    print(f"   Graph compiled successfully with {len(ipca_graph.nodes)} nodes:")
    for node_name in ipca_graph.nodes:
        print(f"    - {node_name}")

    print("\n3. Testing Exception Handlers for All 5 Scenarios:")
    test_app = FastAPI()
    register_exception_handlers(test_app)

    ipca_handler = test_app.exception_handlers[IPCAException]
    val_handler = test_app.exception_handlers[RequestValidationError]

    # Scenario 1a: Auth Error
    res_auth = ipca_handler(None, LLMAuthenticationError("Invalid API key"))
    assert res_auth.status_code == 401
    print("   [Scenario 1a - Auth Failure] Passed: 401", res_auth.body.decode())

    # Scenario 1b: Quota Error
    res_quota = ipca_handler(None, LLMQuotaExceededError("Quota exceeded"))
    assert res_quota.status_code == 429
    print("   [Scenario 1b - Quota Exceeded] Passed: 429", res_quota.body.decode())

    # Scenario 2: Agent Invalid Data
    res_agent = ipca_handler(None, AgentDataValidationError("Malformed JSON", agent_name="Resume Agent", raw_output="not json"))
    assert res_agent.status_code == 502
    print("   [Scenario 2 - Malformed Data] Passed: 502", res_agent.body.decode())

    # Scenario 3: Agent Timeout
    res_timeout = ipca_handler(None, LLMTimeoutError("Agent timed out after 45s", timeout_seconds=45.0))
    assert res_timeout.status_code == 504
    print("   [Scenario 3 - Agent Timeout] Passed: 504", res_timeout.body.decode())

    # Scenario 4: Workflow Execution Crash
    res_wf = ipca_handler(None, WorkflowExecutionError("Graph execution crashed", failed_node="interview_node"))
    assert res_wf.status_code == 500
    print("   [Scenario 4 - Workflow Crash] Passed: 500", res_wf.body.decode())

    # Scenario 5: Input Validation Error
    try:
        IPCARequest(student_name="A", resume_text="Too short", target_role="")
    except Exception as exc:
        val_exc = RequestValidationError(errors=[{"loc": ("body", "resume_text"), "msg": "String should have at least 50 characters", "type": "string_too_short"}])
        res_val = val_handler(None, val_exc)
        assert res_val.status_code == 422
        print("   [Scenario 5 - Input Validation] Passed: 422", res_val.body.decode())

    print("\n================ ALL CHECKS PASSED PERFECTLY ================")

if __name__ == "__main__":
    test_all()
