# Placement Assistant

Phase 6 foundation for an AI-powered placement and career platform.

## Layout

- `Frontend`: React + TypeScript client
- `Backend`: Express API and BullMQ worker runtime
- `packages`: shared types, validation, configuration, database, and AI contracts
- `Multi-agent AI/backend`: protected FastAPI/LangGraph agent service
- `docker-compose.yml`: local web, API, worker, FastAPI AI service, MongoDB, and Redis services

## Local development

1. Copy the single root `.env.example` to `.env`, set `GEMINI_API_KEY`, `AI_SERVICE_TOKEN`, Supabase Storage values, and replace the JWT secret placeholders with values of at least 32 characters.
2. Install dependencies with `npm install` at the repository root.
3. Start MongoDB and Redis: `docker compose up mongodb redis`.
4. In three terminals, run `npm run dev:api`, `npm run worker --workspace=@placement-assistant/api`, and `npm run dev:web`.
5. In a fourth terminal, from `Multi-agent AI/backend`, run `python -m uvicorn main:app --reload --port 8000`.
6. Visit `http://localhost:5173`; API health is at `http://localhost:4000/api/v1/health`.

Run `npm run verify` (runs `typecheck`, `lint`, `test`, and `build`) or `npm test` before pushing changes.

## Verification and CI/CD Pipeline

The repository features a unified multi-service CI workflow (`.github/workflows/ci.yml`):
- **Node.js Quality**: Runs across all workspaces (`packages/*`, `Backend`, `Frontend`) with strict type-checking, ESLint validation, Vitest unit tests, and production artifact builds.
- **Python Quality**: Validates the Multi-Agent AI service (`Multi-agent AI/backend`) by compiling the 8-node LangGraph workflow, verifying 18 registered REST endpoints, and testing all 5 failure/exception scenarios.
- **Docker Compose Validation**: Ensures Docker service definitions, networks, volumes, health checks, and build contexts remain syntactically sound.

## Environment configuration

The root `.env` is the single runtime configuration file for the Express API, BullMQ worker, Docker Compose services, and FastAPI service. `GEMINI_API_KEY`, `AI_SERVICE_TOKEN`, and Supabase secret keys are server-only: do not put them in a `VITE_*` variable or any frontend file. Resume files are stored in a private Supabase Storage bucket shared by the API and worker. The Express API reaches FastAPI through `AI_SERVICE_URL`; the browser never calls FastAPI or Gemini directly.

## Multi-agent AI integration

Authenticated users access the protected FastAPI system only through Express: `POST /api/v1/ai/workflow`, `/api/v1/ai/interview/questions`, `/api/v1/ai/interview/evaluate`, and `/api/v1/ai/careers`. Configure the same `AI_SERVICE_TOKEN` in Express and FastAPI. Workflow requests are queued and processed by the worker so long-running Gemini calls do not time out browser requests.

## Phase 2 API

Authentication uses a short-lived bearer access token and a rotating HTTP-only refresh cookie. Register with `POST /api/v1/auth/register`, sign in with `POST /api/v1/auth/login`, then send `Authorization: Bearer <accessToken>` to access `GET` and `PUT /api/v1/profile`.

## Phase 3 API

Send an authenticated `multipart/form-data` request to `POST /api/v1/resumes` with a `resume` field containing a PDF or DOCX under `UPLOAD_MAX_BYTES` (5 MB by default). The API returns `202`; poll `GET /api/v1/resumes/:id` for `UPLOADED`, `PROCESSING`, `READY`, or `FAILED`.

## Phase 5 API

Declare skills with `PUT /api/v1/skills`, select a supported target role in the profile, then use `GET /api/v1/skill-gaps` and `POST /api/v1/careers/analyze`. Results state exactly which skill evidence exists and never claim an employment probability.

## Phase 4 Resume Agent

After text extraction is `READY`, call `POST /api/v1/resumes/:id/analyze`, then retrieve a validated stored analysis from `GET /api/v1/resumes/:id/analysis`. Configure `GEMINI_API_KEY` and `GEMINI_MODEL`; no analysis is fabricated when the provider is unavailable.

## Phase 6 RAG setup

Gemini embeddings use the same `GEMINI_API_KEY`; configure `GEMINI_EMBEDDING_MODEL` and `GEMINI_EMBEDDING_DIMENSIONS`, then create the Atlas Vector Search index described in [mongodb-vector-index.json](docs/ai/mongodb-vector-index.json). An ADMIN can queue knowledge documents at `POST /api/v1/knowledge/documents`; authenticated requests to `POST /api/v1/knowledge/search` retrieve source-attributed chunks.

## Phase 7 AI career chat

Create a conversation through `POST /api/v1/chat/conversations`, then post a message to `/api/v1/chat/conversations/:id/messages`. The orchestrator can use only owner-scoped resume analysis, skills, career data, and retrieved knowledge; each response records its sources and selected specialist agents.

## Phase 8 Job Matching

Admins create job requirements. Students can call `POST /api/v1/jobs/match` with `{ "jobId": "..." }` to receive source-backed requirement coverage and preparation recommendations.
