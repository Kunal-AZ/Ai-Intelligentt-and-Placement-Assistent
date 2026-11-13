import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import APIRouter, Depends, HTTPException, status
from schemas.api_schema import IPCARequest
from schemas.api_response import IPCAResponse
from services.ipca_service import run_ipca_workflow
from workflow.graph import ipca_graph
from core.exceptions import IPCAException
from utils.logger import logger
from database.dependencies import get_database
from repositories.analysis_repository import (
    get_analysis_by_id,
    get_student_analyses,
    delete_analysis
)

router = APIRouter(
    prefix="/api/v1/ipca",
    tags=["IPCA"]
)


@router.post(
    "/analyze",
    response_model=IPCAResponse
)
def analyze_student(request: IPCARequest):
    """
    Execute full multi-agent career analysis for a student.
    Handles input validation, AI failures, timeouts, and workflow exceptions.
    """
    try:
        logger.info("IPCA workflow request received for student: %s", request.student_name)
        result = run_ipca_workflow(request)

        if result.get("workflow_status") == "failed":
            error_detail = result.get("error", "IPCA analysis failed.")
            logger.error("IPCA workflow failed: %s", error_detail)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_detail
            )

        logger.info("IPCA workflow completed successfully for student: %s", request.student_name)
        return result

    except HTTPException:
        raise

    except IPCAException:
        raise

    except Exception as error:
        logger.exception("Unexpected error in IPCA analyze endpoint: %s", str(error))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(error)}"
        )


@router.get("/state/{thread_id}")
def get_ipca_state(thread_id: str):
    """Retrieve saved LangGraph checkpoint state for a given thread ID."""
    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    try:
        snapshot = ipca_graph.get_state(config)

        if not snapshot.values:
            raise HTTPException(
                status_code=404,
                detail="Workflow state not found"
            )

        return {
            "thread_id": thread_id,
            "state": snapshot.values,
            "next": snapshot.next
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception("Unable to retrieve IPCA state for thread %s", thread_id)
        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve workflow state"
        )


@router.get("/history/{student_id}")
async def analysis_history(
    student_id: str,
    database=Depends(get_database)
):
    """Retrieve past analysis history for a given student ID."""
    analyses = await get_student_analyses(database, student_id)
    return {
        "student_id": student_id,
        "total_analyses": len(analyses),
        "analyses": analyses
    }


@router.get("/result/{analysis_id}")
async def get_analysis(
    analysis_id: str,
    database=Depends(get_database)
):
    """Retrieve a specific analysis by its database ID."""
    analysis = await get_analysis_by_id(database, analysis_id)
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )
    return analysis


@router.delete("/result/{analysis_id}")
async def remove_analysis(
    analysis_id: str,
    database=Depends(get_database)
):
    """Delete a stored analysis by its database ID."""
    deleted = await delete_analysis(database, analysis_id)
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found or could not be deleted"
        )
    return {
        "status": "success",
        "message": "Analysis deleted successfully"
    }
