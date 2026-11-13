"""Workflow nodes for IPCA multi-agent pipeline."""
from workflow.graph import (
    resume_node,
    resume_quality_node,
    route_after_resume,
    resume_improvement_node,
    skill_gap_node,
    interview_node,
    career_node,
    final_report_node
)

__all__ = [
    "resume_node",
    "resume_quality_node",
    "route_after_resume",
    "resume_improvement_node",
    "skill_gap_node",
    "interview_node",
    "career_node",
    "final_report_node"
]

from utils.monitoring import monitor_agent

def resume_node(state):

    result, execution_time = monitor_agent(
        "Resume Agent",
        analyze_resume,
        state["resume_text"]
    )

    return {
        "resume_analysis": result,
        "resume_execution_time": execution_time,
        "workflow_status": "resume_completed"
    }