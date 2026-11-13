
from pydantic import BaseModel, Field


class StudentInput(BaseModel):

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
