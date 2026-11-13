import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from utils.logger import logger
from core.exceptions import IPCAException, AgentDataValidationError
from exceptions import AgentExecutionError


def execute_agent(agent_name: str, agent_function, *args, **kwargs):
    """Execute an agent function with structured logging and error boundary."""
    try:
        logger.info("[AGENT START] %s", agent_name)
        result = agent_function(*args, **kwargs)
        logger.info("[AGENT SUCCESS] %s", agent_name)
        return result

    except IPCAException as err:
        logger.error("[AGENT ERROR] %s failed: %s", agent_name, err.message)
        raise

    except Exception as error:
        logger.exception("[AGENT UNHANDLED ERROR] %s failed: %s", agent_name, str(error))
        raise AgentExecutionError(
            message=f"{agent_name} execution failed: {str(error)}",
            agent_name=agent_name
        ) from error
