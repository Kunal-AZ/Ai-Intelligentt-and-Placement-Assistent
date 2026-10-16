# Placement Assistant

Phase 1 foundation for an AI-powered placement and career platform.

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
