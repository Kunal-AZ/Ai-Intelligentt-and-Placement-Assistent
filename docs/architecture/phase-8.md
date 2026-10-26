# Phase 8: Transparent Job Matching

Admins create companies and active jobs with explicit required and preferred skills. A student match joins only their own skill evidence and most recent validated resume analysis. It reports required/preferred evidence counts, existing requirements with their evidence source, missing required skills, and preparation actions. It never predicts an offer or application outcome.

API: `GET /jobs`, `POST /jobs/companies` (ADMIN), `POST /jobs` (ADMIN), `POST /jobs/match`, and `GET /jobs/matches`.
