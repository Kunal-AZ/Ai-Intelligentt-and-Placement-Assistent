
from pydantic import BaseModel, Field


class IPCARequest(BaseModel):

    student_name: str = Field(
        min_length=2,
        max_length=100
    )

    resume_text: str = Field(
        min_length=50,
        max_length=20000
    )

    target_role: str = Field(
        min_length=2,
        max_length=100
    )

    # Skills already recorded in the application are merged with skills
    # extracted from the resume before gap and recommendation agents run.
    current_skills: list[str] = Field(default_factory=list, max_length=50)
