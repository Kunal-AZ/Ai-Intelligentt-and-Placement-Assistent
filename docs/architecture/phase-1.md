# Phase 1 architecture

`Frontend` is the browser application. `Backend` is the API and future AI-worker runtime. Shared packages define the contracts that cross service boundaries, keeping later features independent from transport and persistence details.

## Boundaries

- `packages/types`: stable API and domain types.
- `packages/validation`: shared Zod schemas for untrusted inputs and later structured AI output.
- `packages/database`: MongoDB lifecycle only; data models arrive with their owning modules.
- `packages/ai-core`: agent context and source-attribution contracts only.
- `packages/config`: validated runtime configuration.
- `Backend/src/modules`: future feature modules such as auth, profiles, resumes, and assessments.
- `Backend/src/ai`: orchestration, specialist agents, and RAG boundaries reserved for later phases.
- `Backend/src/queues` and `src/workers`: asynchronous job boundaries; long AI work must not block HTTP requests.

The current API exposes only `GET /api/v1/health`. No identity, student data, model calls, or fabricated metrics exist yet.
