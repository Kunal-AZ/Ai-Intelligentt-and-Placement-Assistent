# Phase 6: Retrieval-Augmented Generation foundation

## Ingestion

Only an `ADMIN` may add a structured knowledge document. The API stores document metadata, queues ingestion, then the worker normalizes content into overlapping chunks, creates real provider embeddings, and persists each vector with source metadata. The document becomes `READY` only after every chunk succeeds.

```text
Admin document → KnowledgeDocument QUEUED → BullMQ
→ chunking → embedding provider → KnowledgeChunk vectors → READY
```

An embedding is never invented. Missing API credentials, provider failures, malformed vectors, and bad content result in an explicit failed document state.

## Retrieval

`POST /api/v1/knowledge/search` embeds the query then performs MongoDB Atlas `$vectorSearch` against `KnowledgeChunk.embedding`. Results contain the chunk text and title, source label, URL, tags, and similarity score. `buildRetrievalContext` produces a source-labelled context block for Phase 7’s orchestrator; it does not generate a response itself.

## Atlas setup

Create a Vector Search index named `knowledge_vector_index` on the `knowledgechunks` collection. Use [mongodb-vector-index.json](../ai/mongodb-vector-index.json), updating `numDimensions` if a different embedding model is configured. Docker’s local MongoDB image does not provide `$vectorSearch`; use Atlas for semantic retrieval.

## API

- `POST /api/v1/knowledge/documents` — ADMIN only; queues ingestion.
- `GET /api/v1/knowledge/documents` — ADMIN only; ingestion status.
- `GET /api/v1/knowledge/documents/:id` — ADMIN only.
- `POST /api/v1/knowledge/search` — authenticated semantic retrieval with sources.
