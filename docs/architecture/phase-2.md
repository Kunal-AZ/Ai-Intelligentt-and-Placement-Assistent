# Phase 2: Identity, profiles, and authorization

The API owns authentication. The browser will keep short-lived access tokens in memory and receives a rotating refresh token in an HTTP-only cookie. Refresh-token records are stored only as SHA-256 hashes and revoked atomically before their replacement is issued.

## Collections

- `users`: unique normalized email, bcrypt password hash, role, verification state, and reset/verification token hashes for future email workflows.
- `profiles`: one-to-one student-facing profile keyed by `userId`.
- `refreshTokens`: hashed, expiring, revocable refresh-session records.

## Authorization

`requireAuthentication` validates the bearer access token and attaches only its subject and role to the request. `requireRole('ADMIN')` or `requireRole('COUNSELOR')` can protect later modules without duplicating authorization logic. Registration always assigns `STUDENT`; public input cannot select a privileged role.

## API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/profile`
- `PUT /api/v1/profile`

Password-reset and email-verification fields are present but mail delivery and verification endpoints intentionally wait for a dedicated notification phase.
