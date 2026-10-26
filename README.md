# Placement Assistant

Phase 6 foundation for an AI-powered placement and career platform.

## Layout

- `Frontend`: React + TypeScript client
- `Backend`: Express API and BullMQ worker runtime
- `packages`: shared types, validation, configuration, database, and AI contracts
- `docker-compose.yml`: local web, API, worker, MongoDB, and Redis services

## Local development

1. Copy `.env.example` to `.env` and replace the secret placeholders with values of at least 32 characters.
2. Install dependencies with `npm install` at the repository root.
3. Start MongoDB and Redis: `docker compose up mongodb redis`.
4. In two terminals, run `npm run dev:api` and `npm run dev:web`.
5. Visit `http://localhost:5173`; API health is at `http://localhost:4000/api/v1/health`.

Run `npm run typecheck`, `npm run lint`, and `npm run build` before merging changes.

## Phase 2 API

Authentication uses a short-lived bearer access token and a rotating HTTP-only refresh cookie. Register with `POST /api/v1/auth/register`, sign in with `POST /api/v1/auth/login`, then send `Authorization: Bearer <accessToken>` to access `GET` and `PUT /api/v1/profile`.

## Phase 3 API

Send an authenticated `multipart/form-data` request to `POST /api/v1/resumes` with a `resume` field containing a PDF or DOCX under `UPLOAD_MAX_BYTES` (5 MB by default). The API returns `202`; poll `GET /api/v1/resumes/:id` for `UPLOADED`, `PROCESSING`, `READY`, or `FAILED`.

## Phase 5 API

Declare skills with `PUT /api/v1/skills`, select a supported target role in the profile, then use `GET /api/v1/skill-gaps` and `POST /api/v1/careers/analyze`. Results state exactly which skill evidence exists and never claim an employment probability.

## Phase 4 Resume Agent

After text extraction is `READY`, call `POST /api/v1/resumes/:id/analyze`, then retrieve a validated stored analysis from `GET /api/v1/resumes/:id/analysis`. Configure `LLM_API_KEY` and `LLM_MODEL`; no analysis is fabricated when the provider is unavailable.

## Phase 6 RAG setup

Set `EMBEDDING_API_KEY` to an OpenAI-compatible embeddings key, then create the Atlas Vector Search index described in [mongodb-vector-index.json](docs/ai/mongodb-vector-index.json). An ADMIN can queue knowledge documents at `POST /api/v1/knowledge/documents`; authenticated requests to `POST /api/v1/knowledge/search` retrieve source-attributed chunks.

## Phase 7 AI career chat

Create a conversation through `POST /api/v1/chat/conversations`, then post a message to `/api/v1/chat/conversations/:id/messages`. The orchestrator can use only owner-scoped resume analysis, skills, career data, and retrieved knowledge; each response records its sources and selected specialist agents.

## Phase 8 Job Matching

Admins create job requirements. Students can call `POST /api/v1/jobs/match` with `{ "jobId": "..." }` to receive source-backed requirement coverage and preparation recommendations.
