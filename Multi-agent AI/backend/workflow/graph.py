import os
import sys
from pathlib import Path
from typing import Literal

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.mongodb import MongoDBSaver
from pymongo import MongoClient

from workflow.state import IPCAState
from workflow.quality_checker import evaluate_resume_quality
from agents.resume_agent import analyze_resume_with_ai
from agents.skill_gap_agent import analyze_skill_gaps
from agents.interview_agent import generate_interview_questions
from agents.career_agent import generate_career_recommendations
from core.exceptions import WorkflowExecutionError


# =================================
# NODE 1: RESUME ANALYSIS (FAULT-TOLERANT)
# =================================

def resume_node(state: IPCAState):
    print("[IPCA] Resume Agent Started")

    name = state.get("student_name", "Student")
    resume_text = state.get("resume_text", "")
    target_role = state.get("target_role", "Software Developer")

    try:
        result = analyze_resume_with_ai(
            name=name,
            resume_text=resume_text,
            target_role=target_role
        )
        data = result.model_dump() if hasattr(result, "model_dump") else result

        return {
            "resume_analysis": data,
            "workflow_status": "resume_analyzed"
        }

    except Exception as e:
        print(f"[IPCA ERROR in Resume Node]: {str(e)}")
        errors = list(state.get("errors") or [])
        errors.append(f"Resume analysis failed: {str(e)}")
        return {
            "resume_analysis": None,
            "error": str(e),
            "errors": errors,
            "workflow_status": "failed"
        }


# =================================
# NODE 2: RESUME QUALITY CHECK
# =================================

def resume_quality_node(state: IPCAState):
    print("[IPCA] Evaluating Resume Quality")

    # If resume analysis failed earlier, skip to improvement
    if not state.get("resume_analysis"):
        return {
            "resume_quality_score": 0,
            "missing_sections": ["Resume Analysis Data (Generation Failed)"]
        }

    analysis = state.get("resume_analysis") or {}
    resume_text = state.get("resume_text", "")

    result = evaluate_resume_quality(analysis, resume_text=resume_text)
    score = result.get("score", 0)
    missing_sections = result.get("missing_sections", [])

    print(f"[IPCA] Resume Quality Score: {score}/100")

    return {
        "resume_quality_score": score,
        "missing_sections": missing_sections
    }


# Conditional router function
def route_after_resume(state: IPCAState) -> Literal["continue", "improve"]:
    # A low-quality resume still contains useful skill evidence.  Continue to
    # the gap and recommendation agents so the student receives an actionable
    # plan; reserve the early exit only for a true resume-analysis failure.
    if state.get("workflow_status") == "failed":
        return "improve"
    return "continue"


# =================================
# NODE 3: RESUME IMPROVEMENT (FEEDBACK)
# =================================

def resume_improvement_node(state: IPCAState):
    print("[IPCA] Resume Improvement / Early Exit")

    missing = state.get("missing_sections", [])
    feedback = [f"Please add or improve your {sec} section." for sec in missing]

    if state.get("error"):
        feedback.append(f"System note: {state.get('error')}")

    report = {
        "status": "resume_improvement_required" if not state.get("error") else "failed",
        "resume_score": state.get("resume_quality_score", 0),
        "missing_sections": missing,
        "recommendations": feedback,
        "error": state.get("error")
    }

    return {
        "resume_feedback": "\n".join(feedback),
        "final_report": report,
        "workflow_status": "resume_needs_improvement" if not state.get("error") else "failed"
    }


# =================================
# NODE 4: SKILL GAP ANALYSIS (FAULT-TOLERANT)
# =================================

def skill_gap_node(state: IPCAState):
    print("[IPCA] Skill Gap Agent Started")

    name = state.get("student_name", "Student")
    target_role = state.get("target_role", "Software Developer")

    resume_analysis = state.get("resume_analysis") or {}
    resume_skills = resume_analysis.get("extracted_skills", [])
    recorded_skills = state.get("current_skills", [])
    # Preserve the student's existing evidence alongside resume claims.  This
    # makes the gap analysis a comparison of the selected role against the
    # complete current skill picture, not just a single uploaded document.
    skills = list(dict.fromkeys([*recorded_skills, *resume_skills]))
    if not skills:
        skills = ["General Software Engineering"]

    try:
        result = analyze_skill_gaps(
            student_name=name,
            existing_skills=skills,
            target_role=target_role,
            experience_level="Fresher"
        )
        data = result.model_dump() if hasattr(result, "model_dump") else result
        return {"skill_gap_analysis": data}

    except Exception as e:
        print(f"[IPCA ERROR in Skill Gap Node]: {str(e)}")
        errors = list(state.get("errors") or [])
        errors.append(f"Skill gap analysis failed: {str(e)}")
        return {
            "skill_gap_analysis": {"missing_skills": [], "error": str(e)},
            "errors": errors
        }


# =================================
# NODE 5: INTERVIEW PREPARATION (FAULT-TOLERANT)
# =================================

def interview_node(state: IPCAState):
    print("[IPCA] Interview Agent Started")

    name = state.get("student_name", "Student")
    target_role = state.get("target_role", "Software Developer")

    resume_analysis = state.get("resume_analysis") or {}
    skills = resume_analysis.get("extracted_skills", [])
    if not skills:
        skills = ["Core Java", "Python", "Data Structures"]

    try:
        result = generate_interview_questions(
            student_name=name,
            target_role=target_role,
            skills=skills,
            experience_level="Fresher",
            difficulty="Mixed",
            question_count=5
        )
        data = result.model_dump() if hasattr(result, "model_dump") else result
        return {"interview_preparation": data}

    except Exception as e:
        print(f"[IPCA ERROR in Interview Node]: {str(e)}")
        errors = list(state.get("errors") or [])
        errors.append(f"Interview preparation failed: {str(e)}")
        return {
            "interview_preparation": {"questions": [], "error": str(e)},
            "errors": errors
        }


# =================================
# NODE 6: CAREER RECOMMENDATION (FAULT-TOLERANT)
# =================================

def career_node(state: IPCAState):
    print("[IPCA] Career Agent Started")

    name = state.get("student_name", "Student")
    target_role = state.get("target_role", "Software Developer")

    resume_analysis = state.get("resume_analysis") or {}
    skills = list(dict.fromkeys([*(state.get("current_skills", [])), *(resume_analysis.get("extracted_skills", []))]))
    if not skills:
        skills = ["Software Development", "Problem Solving"]

    try:
        result = generate_career_recommendations(
            student_name=name,
            education="Computer Science / Engineering",
            skills=skills,
            interests=[target_role],
            projects=["Academic and practical software projects"],
            experience_level="Fresher",
            preferred_work=target_role
        )
        data = result.model_dump() if hasattr(result, "model_dump") else result
        return {"career_recommendations": data}

    except Exception as e:
        print(f"[IPCA ERROR in Career Node]: {str(e)}")
        errors = list(state.get("errors") or [])
        errors.append(f"Career recommendation failed: {str(e)}")
        return {
            "career_recommendations": {"top_career_paths": [], "error": str(e)},
            "errors": errors
        }


# =================================
# NODE 7: FINAL REPORT
# =================================

def final_report_node(state: IPCAState):
    print("[IPCA] Generating Final Consolidated Report")

    errors = state.get("errors") or []
    has_errors = bool(errors)

    report = {
        "status": "completed_with_warnings" if has_errors else "success",
        "student_name": state.get("student_name"),
        "target_role": state.get("target_role"),
        "resume_quality_score": state.get("resume_quality_score"),
        "resume_analysis": state.get("resume_analysis"),
        "skill_gap_analysis": state.get("skill_gap_analysis"),
        "interview_preparation": state.get("interview_preparation"),
        "career_recommendations": state.get("career_recommendations"),
        "warnings": errors if has_errors else None
    }

    return {
        "final_report": report,
        "workflow_status": "completed_with_warnings" if has_errors else "completed"
    }


# =================================
# CREATE & COMPILE GRAPH
# =================================

builder = StateGraph(IPCAState)

# Register all 7 nodes
builder.add_node("resume", resume_node)
builder.add_node("quality_check", resume_quality_node)
builder.add_node("resume_improvement", resume_improvement_node)
builder.add_node("skill_gap", skill_gap_node)
builder.add_node("interview", interview_node)
builder.add_node("career", career_node)
builder.add_node("final_report", final_report_node)

# Flow: START -> resume -> quality_check
builder.add_edge(START, "resume")
builder.add_edge("resume", "quality_check")

# Conditional Edge: quality_check -> continue OR improve
builder.add_conditional_edges(
    "quality_check",
    route_after_resume,
    {
        "continue": "skill_gap",
        "improve": "resume_improvement"
    }
)

# Early exit if resume needs improvement
builder.add_edge("resume_improvement", END)

# Parallel execution: skill_gap -> interview & career
builder.add_edge("skill_gap", "interview")
builder.add_edge("skill_gap", "career")

# Join parallel branches into final report
builder.add_edge("interview", "final_report")
builder.add_edge("career", "final_report")

# End workflow
builder.add_edge("final_report", END)

# Persist each workflow thread so its state survives API restarts.
# These collections are intentionally separate from application data.
checkpoint_mongo_url = os.getenv("MONGODB_URI") or os.getenv("MONGODB_URL")
if not checkpoint_mongo_url:
    raise RuntimeError("MONGODB_URL or MONGODB_URI must be configured for LangGraph checkpoints.")

checkpoint_mongo_client = MongoClient(checkpoint_mongo_url)
mongo_checkpointer = MongoDBSaver(
    checkpoint_mongo_client,
    db_name=os.getenv("CHECKPOINT_MONGODB_DATABASE", os.getenv("MONGODB_DATABASE", "placement_assistant")),
    checkpoint_collection_name=os.getenv("CHECKPOINT_MONGODB_COLLECTION", "langgraph_checkpoints"),
    writes_collection_name=os.getenv("CHECKPOINT_MONGODB_WRITES_COLLECTION", "langgraph_checkpoint_writes"),
)

# Compile the graph with persistent MongoDB checkpointing enabled.
ipca_graph = builder.compile(checkpointer=mongo_checkpointer)


def build_ipca_graph(checkpoint_saver=None):
    """Factory function to compile the IPCA graph with an optional checkpointer."""
    return builder.compile(checkpointer=checkpoint_saver or mongo_checkpointer)

