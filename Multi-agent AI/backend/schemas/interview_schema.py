
from typing import Literal

from pydantic import BaseModel, Field


# Input for generating interview questions
class InterviewQuestionRequest(BaseModel):

    student_name: str

    target_role: str

    skills: list[str] = Field(min_length=1)

    experience_level: str = "Fresher"

    difficulty: Literal[
        "Easy",
        "Medium",
        "Hard",
        "Mixed"
    ] = "Mixed"

    question_count: int = Field(
        default=5,
        ge=1,
        le=10
    )


# Structure of one generated question
class InterviewQuestion(BaseModel):

    question: str

    topic: str

    difficulty: Literal[
        "Easy",
        "Medium",
        "Hard"
    ]

    question_type: Literal[
        "Technical",
        "Conceptual",
        "Scenario-Based"
    ]

    expected_answer_points: list[str]


# Complete question-generation response
class InterviewQuestionResponse(BaseModel):

    student_name: str

    target_role: str

    questions: list[InterviewQuestion]


# Input for evaluating an answer
class InterviewEvaluationRequest(BaseModel):

    question: str

    topic: str

    expected_answer_points: list[str] = Field(
        min_length=1
    )

    student_answer: str = Field(
        min_length=5,
        max_length=5000
    )


# Structured evaluation response
class InterviewEvaluation(BaseModel):

    score: int = Field(
        ge=0,
        le=10
    )

    verdict: Literal[
        "Excellent",
        "Good",
        "Needs Improvement",
        "Incorrect"
    ]

    strengths: list[str]

    missing_concepts: list[str]

    ideal_answer: str

    feedback: str

    improvement_suggestions: list[str]
