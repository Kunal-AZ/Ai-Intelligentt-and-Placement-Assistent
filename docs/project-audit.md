# Project audit — 21 November 2026

Subsequent update: Google sign-in has now been implemented locally. See [Google sign-in setup](google-sign-in-setup.md) for deployment configuration and live acceptance checks. The original audit findings below describe the earlier snapshot.

The repository implements a student career-preparation application, not the full institutional platform described in SRS.pdf. This audit covers application source, shared contracts, configuration, scripts, CI, documentation, and asset integrity. It is not certification that every possible input, browser, external service, or production deployment works.

## Verification evidence

- `npm run verify`: TypeScript, ESLint, 59 unit tests, and production build passed. Four opt-in MongoDB integration tests are skipped by this command unless `AUDIT_MONGO_URI` is supplied.
- Four database integration tests passed. Database integration suite: real disposable MongoDB, real HTTP requests, bcrypt/JWT authentication, Mongoose persistence, and PDF extraction. AI providers, queues, storage, retrieval, and public job providers are test doubles. This is not a live-provider end-to-end test.
- Python: eight mocked provider regression tests passed plus route registration, graph compilation, and exception-handler checks. No paid provider requests or production database writes were required.
- Browser: landing page rendered; unauthenticated dashboard navigation redirected to login. Authenticated browser journeys, microphone permissions, and cross-browser/mobile acceptance remain unverified. The temporary browser tab was unavailable after resuming the audit.
- All five CSS files parse successfully; workspace dependency declarations match package-lock.json. Seven raster assets decode successfully; both SVG assets parse without script elements. The 18-page SRS was extracted and compared with implementation. These are structural checks, not exhaustive visual/accessibility checks.
- `audit-files.json` records the inventory and scope by file. Dependencies, generated builds, Git internals, caches, logs, and secret environment values are excluded.

## Corrections made

- Deleted/reanalyzed resumes no longer leave their old skill evidence active. A skill identity without evidence is now missing in gap analysis.
- Account changes clear cached queries and reject late responses from the previous session. Roadmap progress is keyed by account and role.
- Dashboard completion totals and interview metrics use completed sessions only.
- Interview retries reuse saved evaluation and next questions after partial provider failures.
- Signup retains last name; login returns to the requested protected route.
- AI interview creation receives the longer request timeout, including the root `/interviews` endpoint.
- Malformed/oversized JSON returns client errors; knowledge document IDs are validated. Resume analysis is rate limited.
- HTTP logs redact bearer tokens and cookies. Nginx accepts the configured upload size and waits for longer AI requests.
- Worker retries clear stale error codes. Resume fixture is included as a text-named PDF payload so it is available in clean checkouts.
- Python node exports and state annotations were repaired; requirements share one source; import verification uses an in-memory checkpoint. Importing the manual workflow demonstration no longer makes provider calls.
- Python workflows no longer insert invented skills, education, projects, or fresher status for missing candidate data.
- Stored chat sources now include only IDs cited by the response.
- Removed fake newsletter success and static operational status. Labeled landing sample metrics/scenarios and removed salary predictions from the practice calculator; corrected unsupported repository-verification claims in the FAQ/sign-in page.
- Added an explicit, non-dropping database index creation command. CI now provisions MongoDB for integration tests and executes Python regressions.

## Workflow coverage and remaining work

| Workflow | Evidence | Remaining acceptance work |
| --- | --- | --- |
| Register/login/refresh/logout | Real HTTP and MongoDB; duplicate email, wrong password, refresh replay, logout checked | Google/OIDC, password reset, verification emails, MFA, device management are absent |
| Profile and access control | Profile edits, forbidden fields, admin restrictions and cross-user access tested | Institution/tenant isolation and expanded SRS roles absent |
| Resume upload/download/delete | Synthetic PDF, extraction, ownership, evidence cleanup tested | Real Supabase policies/network failures; DOCX adversarial cases; worker/delete races |
| Resume/placement AI | Service persistence and mocked provider contracts tested | Real Gemini quota/model access, Redis worker retries and recovery, full live report quality |
| Skills/gaps/careers | Evidence status and career endpoint checked | Career input limits need alignment across services; evidence labels should distinguish claims from verified proficiency |
| Roadmap | Source review, type/build checks, account storage isolation fixed | Browser milestone persistence, cross-device storage (currently local only) |
| Jobs/applications | Listing, admin job/company creation, application update/delete and ownership tested | Real job feeds; strict skill token matching; bounded query cache; repeated APPLIED timestamp semantics |
| Chat/RAG | Conversation ownership, persistence and mocked answer checked | Conversation history is stored but not supplied to the synthesizer; live Atlas vector search and embeddings need verification |
| Text interviews | Start, answer, follow-up, completion, isolation tested; partial-failure unit regressions | Concurrent submissions and live rubric quality |
| Voice interviews | Protocol/unit tests and source review | Real microphone, speakers, Gemini Live permissions/token/model, interrupted network sessions |
| Knowledge ingestion | Admin access, identifier validation, queue dispatch and mocked search checked | Actual queue processing, embeddings and Atlas vector index |
| Plans/settings | Source review; free subscription endpoint checked | Billing and notification delivery are not implemented |
| Deployment | Config/source review, build and CI updates | Fresh Docker rebuild, Nginx runtime, HTTPS/cookies, restart recovery, backup/restore and load tests |

## SRS gaps (planned work, not implemented workflows)

SSO/Google sign-in and MFA; multi-institution tenancy; recruiter approvals/portal; alumni mentoring/referrals; placement drives and eligibility rule engine; consent/retention management; notification delivery; calendar/video integrations; moderation and counselor escalation; institutional analytics and exports; streamed career chat; tenant cost budgets and governance. Performance/availability targets and WCAG compliance have not been established by this audit.

Existing phase architecture documents describe historical milestones and sometimes contradict the current implementation (for example local storage/OpenAI versus current Supabase/Gemini). Use the current source/configuration and root README for setup; those historical documents need consolidation.

## Reproduce checks

From the repository root:

```powershell
npm ci
npm run verify
docker run --detach --rm --name placement-audit-mongo -p 127.0.0.1:27028:27017 mongo:8
$env:AUDIT_MONGO_URI = 'mongodb://127.0.0.1:27028'
npm run test --workspace=@placement-assistant/api
Remove-Item Env:AUDIT_MONGO_URI
docker stop placement-audit-mongo
pip install -r 'Multi-agent AI/requirements.txt'
python 'Multi-agent AI/backend/verify_system.py'
Push-Location 'Multi-agent AI/backend'
python -m unittest discover -s tests -v
Pop-Location
```

The integration suite creates and drops only a random `placement_audit_*` database on the explicitly supplied MongoDB URI. Use a disposable local database, not production credentials.

Before first production traffic, with the intended environment configured, run `npm run db:indexes --workspace=@placement-assistant/api` (or `node Backend/dist/scripts/create-indexes.js` in the built image). This adds declared indexes without dropping existing ones. Resolve duplicate-record/index conflicts if it fails. Atlas vector search indexes remain a separate setup step; dimensions must match `GEMINI_EMBEDDING_DIMENSIONS`.

Recommended next sequence: implement Google sign-in using backend ID-token verification and existing app sessions; exercise real Supabase/Gemini/Redis/Atlas in staging; add authenticated browser regression coverage; then scope the remaining SRS features into separate development work.
