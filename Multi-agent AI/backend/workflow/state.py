from typing import TypedDict, Optional, Any, List


class IPCAState(TypedDict, total=False):
    # Student information
    student_name: str
    resume_text: str
    target_role: str
    current_skills: List[str]

    # Resume Agent
    resume_analysis: Optional[dict[str, Any]]

    # Resume quality evaluation
    resume_quality_score: Optional[float]
    missing_sections: list
    resume_feedback: Optional[Any]

    # Skill Gap Agent
    skill_gap_analysis: Optional[dict[str, Any]]

    # Interview Agent
    interview_preparation: Optional[dict[str, Any]]
    interview_error: Optional[str]

    # Career Agent
    career_recommendations: Optional[dict[str, Any]]
    career_error: Optional[str]

    # Final output
    final_report: Optional[dict[str, Any]]

    # Workflow status and error tracking
    workflow_status: str
    error: Optional[str]
    errors: List[str]
    resume_execution_time: float
skill_gap_execution_time: float
interview_execution_time: float
career_execution_time: float
