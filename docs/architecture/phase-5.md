# Phase 5: Transparent Skill Gap and Career Agents

Phase 4 was explicitly skipped. Consequently, these agents consume only user-declared evidence for now. A later Resume Agent can add `RESUME` evidence to the same `skillEvidence` collection without changing the scoring or recommendation APIs.

## Evidence model

- `skills` is owner-scoped and stores a normalized skill identity.
- `skillEvidence` records where the evidence came from: user declaration, resume, assessment, or interview. An evidence source never overwrites another source.
- `recommendations` persists an explainable snapshot for each chosen target role.

## Methodology

Supported-role requirements are an explicit, version-controlled catalog. A skill is **PRESENT** only if recorded evidence exists. A single beginner self-report is **NEEDS_REINFORCEMENT**. Otherwise it is **MISSING**. The response includes evidence counts—not invented proficiency percentages or employment probabilities.

Career paths are generated only for the student’s selected target roles that exist in the catalog. Every stored recommendation names its target-role selection and exact supporting skill evidence.

## API

- `GET /api/v1/skills`
- `PUT /api/v1/skills` with `{ "skills": [{ "name": "TypeScript", "proficiency": "INTERMEDIATE" }] }`
- `GET /api/v1/skill-gaps?role=Backend%20Developer`
- `GET /api/v1/skill-gaps` (uses profile target roles)
- `POST /api/v1/careers/analyze`
- `GET /api/v1/careers`
