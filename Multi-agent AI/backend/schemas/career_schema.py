
from typing import Literal

from pydantic import BaseModel, Field


# Input provided by the student
class CareerRecommendationRequest(BaseModel):

    student_name: str = Field(
        min_length=1,
        max_length=100
    )

    education: str = Field(
        min_length=2,
        max_length=200
    )

    skills: list[str] = Field(
        min_length=1,
        max_length=40
    )

    interests: list[str] = Field(
        min_length=1,
        max_length=20
    )

    projects: list[str] = Field(
        default_factory=list,
        max_length=10
    )

    experience_level: Literal[
        "Fresher",
        "Beginner",
        "Intermediate",
        "Experienced"
    ] = "Fresher"

    preferred_work: str = Field(
        min_length=2,
        max_length=200
    )


# One recommended career path
class CareerPath(BaseModel):

    career_title: str

    description: str

    match_score: int = Field(
        ge=0,
        le=100
    )

    matching_skills: list[str]

    missing_skills: list[str]

    recommendation_reason: str

    next_steps: list[str]

    learning_roadmap: list[str]

    growth_opportunities: list[str]


# Complete career recommendation
class CareerRecommendationResponse(BaseModel):

    student_name: str

    profile_summary: str

    top_career_paths: list[CareerPath] = Field(
        min_length=1,
        max_length=5
    )

    overall_guidance: str

    alternative_career_options: list[str]
