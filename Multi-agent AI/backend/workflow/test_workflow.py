import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from workflow.graph import ipca_graph


initial_state = {
    "student_name": "Rahul Sharma",
    "resume_text": """
    Rahul Sharma
    B.Tech Computer Science and Engineering

    Skills:
    Java, Spring Boot, Python, React, SQL, HTML, CSS, Git

    Projects:
    1. E-commerce website using Spring Boot, React, and MySQL.
    2. Real-time chat application using Python WebSockets.

    Experience:
    Fresher / Software Engineering Intern
    """,
    "target_role": "Java Developer",
    "resume_analysis": None,
    "resume_quality_score": None,
    "missing_sections": [],
    "resume_feedback": None,
    "skill_gap_analysis": None,
    "interview_preparation": None,
    "career_recommendations": None,
    "final_report": None,
    "workflow_status": "started",
    "error": None,
    "errors": []
}


print("\n========== STARTING IPCA MULTI-AGENT WORKFLOW ==========")

config = {"configurable": {"thread_id": "test-student-rahul"}}

try:
    result = ipca_graph.invoke(initial_state, config=config)

    print("\n[WORKFLOW STATUS]:", result.get("workflow_status"))
    print(f"[RESUME QUALITY SCORE]: {result.get('resume_quality_score')}/100")

    if result.get("resume_feedback"):
        print("\n[RESUME FEEDBACK]:")
        print(result.get("resume_feedback"))

    if result.get("skill_gap_analysis"):
        print("\n[SKILL GAP ANALYSIS]:")
        print(result["skill_gap_analysis"])

    if result.get("interview_preparation"):
        print("\n[INTERVIEW QUESTIONS]:")
        questions = result["interview_preparation"].get("questions", [])
        for i, q in enumerate(questions, 1):
            print(f" {i}. [{q.get('difficulty')}] {q.get('question')}")

    if result.get("career_recommendations"):
        print("\n[CAREER RECOMMENDATIONS]:")
        paths = result["career_recommendations"].get("top_career_paths", [])
        for p in paths:
            print(f" - {p.get('career_title')} (Match: {p.get('match_score')}%)")

    print("\n========== WORKFLOW COMPLETED SUCCESSFULLY ==========")

except Exception as e:
    print("\n[WORKFLOW FAILED]:", str(e))
