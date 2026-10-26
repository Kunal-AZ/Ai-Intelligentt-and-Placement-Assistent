# Phase 7: Structured AI Orchestrator

## Workflow state

The orchestrator accepts `userId` and a chat message, then derives a fixed allow-listed plan. Its structured state carries selected agents, verified facts, citations, and limitations. The plan can use only these tools:

- latest validated resume analysis (owner scoped)
- current skill evidence (owner scoped)
- transparent skill-gap analysis
- career-path analysis
- RAG retrieval with source metadata

It cannot execute arbitrary user prompts, filesystem actions, database queries, or external tools.

## Agent selection

Intent terms select zero or more specialist agents: resume/ATS invokes Resume Agent; skills and supported roles invoke Skill Gap Agent; career intent invokes Career Agent; explanatory knowledge questions invoke the RAG retriever. The final synthesizer receives only the structured facts and source IDs produced by these agents.

## Chat persistence and API

Every message is scoped to its owner. Assistant messages store source references and the agent trace, not hidden prompts or secrets.

- `POST /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:id/messages`
- `POST /api/v1/chat/conversations/:id/messages`

The final LLM response must validate as `{ answer, citedSourceIds, limitations }`; unsupported citation IDs are removed. Missing LLM, embeddings, or Atlas vector search are surfaced as limitations or controlled errors—never a fabricated answer.
