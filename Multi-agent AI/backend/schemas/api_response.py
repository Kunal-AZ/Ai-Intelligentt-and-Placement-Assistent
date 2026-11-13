from typing import Optional, Any, Union, Dict
from pydantic import BaseModel, Field


class IPCAResponse(BaseModel):
    thread_id: Optional[str] = Field(default=None, description="Unique LangGraph thread ID for checkpoint state tracking")
    workflow_status: str = Field(description="Execution status of the workflow")
    final_report: Optional[Dict[str, Any]] = Field(default=None, description="Consolidated report from all agents")
    resume_feedback: Optional[Union[str, Dict[str, Any]]] = Field(default=None, description="Feedback if resume needs improvement")
    error: Optional[str] = Field(default=None, description="Error message if workflow failed")
