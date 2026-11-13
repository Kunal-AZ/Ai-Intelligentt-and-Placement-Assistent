
from pydantic import BaseModel, Field


class SkillDetail(BaseModel):

    skill_name: str

    importance: str = Field(
        description="Priority: High, Medium, or Low"
    )

    reason: str


class LearningStep(BaseModel):

    week: str

    topic: str

    description: str

    estimated_hours: int = Field(
        ge=1,
        le=100
    )


class SkillGapAnalysis(BaseModel):

    target_role: str

    existing_skills: list[str]

    missing_skills: list[SkillDetail]

    strengths: list[str]

    improvement_areas: list[str]

    learning_roadmap: list[LearningStep]

    overall_recommendation: str


class SkillGapRequest(BaseModel):

    student_name: str

    existing_skills: list[str] = Field(
        min_length=1
    )

    target_role: str

    experience_level: str = "Beginner"
