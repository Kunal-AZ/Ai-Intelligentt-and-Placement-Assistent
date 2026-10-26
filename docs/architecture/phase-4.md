# Phase 4: Guarded Resume Agent

## Flow

```text
READY resume extraction → POST /resumes/:id/analyze → BullMQ
→ Resume Agent → Zod validation → ResumeAnalysis → analysisStatus READY
```

The Resume Agent reads only extracted text from the owner’s already-validated file. It receives an explicit prompt-injection boundary: resume text is untrusted data and cannot modify the agent’s instructions. The model is asked for JSON only; Zod validates the result before storage. If the first result is malformed, one isolated repair attempt is made. A second invalid response marks the analysis failed and stores nothing.

## Output

The validated schema includes skills, education, projects, experience, certifications, strengths, weaknesses, ATS issues, missing information, and grounded recommendations. It does not assert job outcomes.

## API

- `POST /api/v1/resumes/:id/analyze` queues analysis after extraction reaches `READY`.
- `GET /api/v1/resumes/:id/analysis` returns the owner’s validated stored analysis.

Set `LLM_API_KEY` and `LLM_MODEL` before enabling analysis. The implementation currently uses OpenAI Chat Completions JSON mode; without configuration it fails explicitly with `LLM_NOT_CONFIGURED`.
