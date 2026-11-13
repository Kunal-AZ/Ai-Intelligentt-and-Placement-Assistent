import sys
import time
from pathlib import Path
from typing import Any, Dict, Tuple, Callable

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from utils.logger import logger
from utils.metrics import (
    AGENT_EXECUTIONS,
    AGENT_DURATION
)


def monitor_agent(agent_name: str, agent_function: Callable, *args, **kwargs) -> Tuple[Any, float]:
    """Execute an agent function while recording execution time and Prometheus metrics."""
    start_time = time.perf_counter()
    logger.info("[MONITOR] %s started", agent_name)

    try:
        with AGENT_DURATION.labels(agent_name=agent_name).time():
            result = agent_function(*args, **kwargs)

        AGENT_EXECUTIONS.labels(
            agent_name=agent_name,
            status="success"
        ).inc()

        execution_time = time.perf_counter() - start_time
        logger.info(
            "[MONITOR] %s completed | execution_time=%.2f seconds",
            agent_name,
            execution_time
        )
        return result, execution_time

    except Exception as exc:
        AGENT_EXECUTIONS.labels(
            agent_name=agent_name,
            status="failure"
        ).inc()

        execution_time = time.perf_counter() - start_time
        logger.exception(
            "[MONITOR] %s failed | execution_time=%.2f seconds: %s",
            agent_name,
            execution_time,
            str(exc)
        )
        raise


def create_monitoring_summary(state: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a consolidated execution time and health summary for workflow state."""
    agent_times = {
        "resume": state.get("resume_execution_time", 0.0),
        "skill_gap": state.get("skill_gap_execution_time", 0.0),
        "interview": state.get("interview_execution_time", 0.0),
        "career": state.get("career_execution_time", 0.0)
    }

    total_agent_time = sum(v for v in agent_times.values() if isinstance(v, (int, float)))

    return {
        "agent_execution_times": agent_times,
        "total_agent_time": round(total_agent_time, 2),
        "workflow_status": state.get("workflow_status"),
        "agent_errors": {
            "interview": state.get("interview_error"),
            "career": state.get("career_error")
        }
    }
