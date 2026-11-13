
from pydantic import BaseModel, Field


# Individual learning roadmap item
class RoadmapStep(BaseModel):
    week: str
    topic: str
    description: str


# Complete resume analysis structure
class ResumeAnalysis(BaseModel):

    summary: str

    extracted_skills: list[str]

    strengths: list[str]

    improvement_areas: list[str]

    missing_skills: list[str]

    readiness_score: int = Field(
        ge=0,
        le=100
    )

    score_explanation: str

    roadmap: list[RoadmapStep]

    interview_questions: list[str]


# Final API response structure
class ResumeAnalysisResponse(BaseModel):

    student_name: str

    target_role: str

    analysis: ResumeAnalysis


class ResumeRequest(BaseModel):

    name: str = Field(min_length=1, max_length=100)

    resume_text: str = Field(
        min_length=50,
        max_length=15000
    )

    target_role: str = Field(
        min_length=2,
        max_length=100
    )
