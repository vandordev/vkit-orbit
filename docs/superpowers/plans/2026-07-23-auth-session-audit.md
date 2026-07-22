# Optional Auth Session and Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship authentication as an installable feature pack, leaving the generated baseline unauthenticated.

**Architecture:** The pack is a documented set of Prisma, application, API, config, and web files copied deliberately into a consumer project. Business transactions remain in the application service; API routes only adapt HTTP/cookies.

**Tech Stack:** Prisma, Bun, Elysia, TanStack Start, Argon2-compatible password verification.

---

## File structure

- Create: `recipes/auth-session-audit/README.md` — installation order and removal boundary.
- Create: `recipes/auth-session-audit/files/packages/database/prisma/schema.prisma.fragment` — `User`, `AuthSession`, `AuditLog` model fragment.
- Create: `recipes/auth-session-audit/files/packages/application/src/auth/{password,sessions,service,policy}.ts` and `audit.ts` — transaction-owned auth logic.
- Create: `recipes/auth-session-audit/files/apps/api/src/{lib/auth.ts,routes/auth.ts,scripts/bootstrap-admin.ts}` — HTTP adapter and bootstrap.
- Create: `recipes/auth-session-audit/tests/` — portable test examples.

### Task 1: Define install contract and schema fragment

- [ ] Write a recipe test/document check requiring installation order: schema migration, application exports, API route registration, server config, optional web shell.
- [ ] Verify it fails because the recipe is absent.
- [ ] Create the README with explicit copy targets, required server-only variables, and uninstall steps. Define neutral `User`, `AuthSession`, and `AuditLog` fragments; `User` has unique normalized email and `isActive`, while `AuthSession` stores `tokenHash`, expiry, revocation, and last-use timestamps.
- [ ] Add migration instructions stating the consuming project creates its Prisma migration after copying the fragment. Commit `docs(recipe): add auth schema contract`.

### Task 2: Add application-level session and audit examples

- [ ] Add test examples for normalized email login, token hashing, expiry renewal, logout revocation, inactive-user rejection, and recursive removal of `/password|hash|token|cookie|authorization/i` audit keys.
- [ ] Run the recipe's Bun tests; expect failures before implementations exist.
- [ ] Implement `issueSession`, `hashSessionToken`, `redactAuditValue`, and a `createAuthService` factory. Its database interface must expose `$transaction`, users, sessions, and audit logs; it returns safe users without password hashes.
- [ ] Re-run recipe tests; expect PASS. Commit `feat(recipe): add session and audit service`.

### Task 3: Add Elysia adapter and bootstrap boundary

- [ ] Add adapter tests for malformed cookies, invalid session `401`, `HttpOnly; Path=/; SameSite=Lax`, HTTP without `Secure`, HTTPS with `Secure`, and idempotent admin bootstrap.
- [ ] Implement `parseSessionCookie`, `serializeSessionCookie`, and `resolveAuthenticatedActor`; route handlers call only the service and map known errors to existing envelopes.
- [ ] Implement an explicit bootstrap command that reads server-only input through the config loader and returns `created` or `already_exists`.
- [ ] Run recipe tests and a consumer fixture typecheck. Commit `feat(recipe): add Elysia session adapter`.

### Task 4: Verify opt-in isolation

- [ ] Add a baseline fixture assertion that no baseline route imports recipe paths and no Vite environment type contains auth secrets.
- [ ] Run baseline API/web tests plus recipe tests; expect PASS.
- [ ] Document role/capability hooks as consumer-owned interfaces, not default enum values. Commit `test(recipe): enforce opt-in auth isolation`.

