# Phase 3: Resume ingestion pipeline

## Request flow

```text
Authenticated student → POST /resumes (multipart)
  → size, extension, and magic-byte validation
  → randomized private storage key
  → resume metadata record
  → BullMQ extraction job
  → worker extracts bounded text
  → READY or FAILED processing state
```

The HTTP request never waits for document extraction. The original file is stored with restrictive local permissions in development. `resume.storage.ts` is the sole storage boundary, so a production object-store adapter can replace it without changing routes or workers.

## Security properties

- Only PDF and DOCX upload fields are accepted; both extension and content signature must agree.
- Files are held in memory only up to `UPLOAD_MAX_BYTES` (default 5 MB), then written once under a UUID storage key.
- User filenames are sanitized before metadata storage and are never used as filesystem paths.
- Storage keys and extracted text are excluded from regular resume list responses.
- Every resume query filters by the authenticated user ID. Downloads are owner scoped.
- Extracted document text remains untrusted input; it is not sent to an LLM until Phase 4's guarded analysis pipeline.

## API

- `POST /api/v1/resumes` — multipart field `resume`; returns `202 Accepted`.
- `GET /api/v1/resumes` — owner’s resume metadata and status.
- `GET /api/v1/resumes/:id` — owner’s resume metadata and status.
- `GET /api/v1/resumes/:id/download` — owner’s original document.
