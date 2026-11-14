import sys
import uuid
from pathlib import Path
from typing import Union, Dict, Any, Optional

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from schemas.api_schema import IPCARequest
from workflow.input_schema import StudentInput
from workflow.graph import ipca_graph
from utils.logger import logger


def run_ipca_workflow(
    student: Union[IPCARequest, StudentInput, Dict[str, Any]],
    thread_id: Optional[str] = None
) -> Dict[str, Any]:
    """Execute the full IPCA multi-agent LangGraph workflow with checkpointing and state tracking."""
    if not thread_id:
        thread_id = str(uuid.uuid4())

    if isinstance(student, dict):
        student_name = student.get("student_name", "")
        resume_text = student.get("resume_text", "")
        target_role = student.get("target_role", "")
        current_skills = student.get("current_skills", [])
    else:
        student_name = student.student_name
        resume_text = student.resume_text
        target_role = student.target_role
        current_skills = getattr(student, "current_skills", [])

    initial_state = {
        "student_name": student_name,
        "resume_text": resume_text,
        "target_role": target_role,
        "current_skills": current_skills,
        "resume_analysis": None,
        "resume_quality_score": None,
        "missing_sections": [],
        "resume_feedback": None,
        "skill_gap_analysis": None,
        "interview_preparation": None,
        "career_recommendations": None,
        "interview_error": None,
        "career_error": None,
        "final_report": None,
        "workflow_status": "started",
        "error": None,
        "errors": []
    }

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    logger.info("Starting IPCA workflow for student '%s' (thread_id: %s)", student_name, thread_id)

    try:
        result = ipca_graph.invoke(initial_state, config=config)

        return {
            "thread_id": thread_id,
            "workflow_status": result.get("workflow_status", "completed"),
            "final_report": result.get("final_report"),
            "resume_feedback": result.get("resume_feedback"),
            "error": result.get("error")
        }

    except Exception as error:
        logger.exception("IPCA Workflow Execution Error (thread_id: %s): %s", thread_id, str(error))
        return {
            "thread_id": thread_id,
            "workflow_status": "failed",
            "final_report": None,
            "resume_feedback": None,
            "error": str(error)
        }
