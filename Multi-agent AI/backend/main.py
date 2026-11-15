import os
import secrets
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend directory is in sys.path so schemas, services, and agents can be imported from anywhere
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# The repository root .env is the single runtime configuration source.
load_dotenv(dotenv_path=backend_dir.parents[1] / ".env")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.exception_handlers import register_exception_handlers
from core.exceptions import (
    IPCAException,
    LLMAPIError,
    LLMAuthenticationError,
    LLMQuotaExceededError,
    AgentDataValidationError,
    LLMTimeoutError,
    WorkflowExecutionError
)

from agents.llm_client import GeminiAPIError

from schemas.resume_schema import (
    ResumeRequest,
    ResumeAnalysisResponse
)
from agents.resume_agent import analyze_resume_with_ai

from schemas.skill_gap_schema import (
    SkillGapRequest,
    SkillGapAnalysis
)
from agents.skill_gap_agent import analyze_skill_gaps

from schemas.interview_schema import (
    InterviewQuestionRequest,
    InterviewQuestionResponse,
    InterviewEvaluationRequest,
    InterviewEvaluation
)
from agents.interview_agent import (
    generate_interview_questions,
    evaluate_interview_answer
)

from schemas.career_schema import (
    CareerRecommendationRequest,
    CareerRecommendationResponse
)
from agents.career_agent import (
    generate_career_recommendations
)

from schemas.api_schema import IPCARequest
from schemas.api_response import IPCAResponse
from services.ipca_service import run_ipca_workflow
from routers.ipca_router import router as ipca_router
from database.connection import mongo_lifespan


app = FastAPI(
    title="IPCA - Intelligent Placement & Career Assistant",
    description="""
    AI-powered multi-agent placement and career assistant.

    Features:
    - Resume Quality & Skill Analysis
    - Skill Gap Evaluation & Learning Roadmaps
    - Technical Interview Preparation & Answer Evaluation
    - Career Path Guidance
    - End-to-End Orchestrated LangGraph Workflow
    """,
    version="1.0.0",
    lifespan=mongo_lifespan
)

@app.middleware("http")
async def require_internal_service_token(request: Request, call_next):
    """Keep the agent API private even if a hosting provider exposes its URL."""
    if request.url.path in {"/health", "/docs", "/openapi.json", "/redoc"}:
        return await call_next(request)

    expected = os.getenv("AI_SERVICE_TOKEN", "")
    supplied = request.headers.get("x-ai-service-token", "")
    if not expected:
        return JSONResponse(status_code=503, content={"detail": "AI service authentication is not configured."})
    if not secrets.compare_digest(supplied, expected):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized AI service request."})
    return await call_next(request)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Custom Exception Handlers across all 5 failure scenarios
register_exception_handlers(app)

# Include IPCA API Router
app.include_router(ipca_router)


# Welcome API
@app.get("/")
def home():
    return {
        "message": "Welcome to IPCA Backend (Gemini-Powered)",
        "status": "running"
    }


# Health API
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# Students API
@app.get("/students")
def get_students():
    students = [
        {
            "id": 1,
            "name": "Kunal",
            "skills": ["Java", "React", "MongoDB"]
        },
        {
            "id": 2,
            "name": "Rahul",
            "skills": ["Python", "SQL", "Machine Learning"]
        }
    ]

    return {
        "total": len(students),
        "students": students
    }


# AI Resume Analysis API
@app.post(
    "/analyze-resume",
    response_model=ResumeAnalysisResponse,
    tags=["Agents"]
)
def analyze_resume(request: ResumeRequest):
    try:
        analysis = analyze_resume_with_ai(
            name=request.name,
            resume_text=request.resume_text,
            target_role=request.target_role
        )

        return ResumeAnalysisResponse(
            student_name=request.name,
            target_role=request.target_role,
            analysis=analysis
        )

    except IPCAException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# AI Skill Gap Analysis API
@app.post(
    "/analyze-skills",
    response_model=SkillGapAnalysis,
    tags=["Agents"]
)
def analyze_skills(request: SkillGapRequest):
    try:
        result = analyze_skill_gaps(
            student_name=request.student_name,
            existing_skills=request.existing_skills,
            target_role=request.target_role,
            experience_level=request.experience_level
        )

        return result

    except IPCAException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# AI Interview Questions Generation API
@app.post(
    "/generate-interview-questions",
    response_model=InterviewQuestionResponse,
    tags=["Agents"]
)
def generate_questions(request: InterviewQuestionRequest):
    try:
        result = generate_interview_questions(
            student_name=request.student_name,
            target_role=request.target_role,
            skills=request.skills,
            experience_level=request.experience_level,
            difficulty=request.difficulty,
            question_count=request.question_count
        )

        return result

    except IPCAException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# AI Interview Answer Evaluation API
@app.post(
    "/evaluate-interview-answer",
    response_model=InterviewEvaluation,
    tags=["Agents"]
)
def evaluate_answer(request: InterviewEvaluationRequest):
    try:
        result = evaluate_interview_answer(
            question=request.question,
            topic=request.topic,
            expected_answer_points=request.expected_answer_points,
            student_answer=request.student_answer
        )

        return result

    except IPCAException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# AI Career Recommendation API
@app.post(
    "/recommend-career",
    response_model=CareerRecommendationResponse,
    tags=["Agents"]
)
def recommend_career(request: CareerRecommendationRequest):
    try:
        result = generate_career_recommendations(
            student_name=request.student_name,
            education=request.education,
            skills=request.skills,
            interests=request.interests,
            projects=request.projects,
            experience_level=request.experience_level,
            preferred_work=request.preferred_work
        )

        return result

    except IPCAException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Career recommendation generation failed: {str(e)}"
        )


# Full Workflow API Endpoint
@app.post(
    "/run-workflow",
    response_model=IPCAResponse,
    tags=["Workflow"]
)
def run_full_workflow(request: IPCARequest):
    result = run_ipca_workflow(request)
    if result.get("workflow_status") == "failed":
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Workflow execution failed.")
        )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
