from typing import Optional


def evaluate_resume_quality(resume_analysis: dict, resume_text: Optional[str] = "") -> dict:
    """Evaluate resume completeness across technical skills, education, projects, and summary."""
    missing_sections = []

    text_lower = (resume_text or "").lower()

    # 1. Check Technical Skills
    skills = resume_analysis.get("extracted_skills") or resume_analysis.get("technical_skills") or []
    if not skills:
        missing_sections.append("Technical Skills")

    # 2. Check Education
    education_keywords = [
        "b.tech", "btech", "b.e", "be", "bca", "mca", "b.sc", "bsc",
        "m.tech", "bachelor", "master", "degree", "university", "college",
        "education", "institute", "diploma", "cgpa", "percentage"
    ]
    has_education = any(kw in text_lower for kw in education_keywords) or bool(resume_analysis.get("education"))
    if not has_education:
        missing_sections.append("Education Details")

    # 3. Check Projects
    project_keywords = [
        "project", "projects", "developed", "built", "implemented",
        "application", "github", "website", "system", "stack", "full stack"
    ]
    has_projects = any(kw in text_lower for kw in project_keywords) or bool(resume_analysis.get("projects"))
    if not has_projects:
        missing_sections.append("Project Experience")

    # 4. Check Professional Strengths / Summary
    strengths = resume_analysis.get("strengths") or []
    summary = resume_analysis.get("summary") or ""
    if not strengths and not summary:
        missing_sections.append("Professional Summary / Strengths")

    # Calculate Score
    total_sections = 4
    completed_sections = total_sections - len(missing_sections)
    score = int((completed_sections / total_sections) * 100)

    return {
        "score": score,
        "missing_sections": missing_sections
    }
