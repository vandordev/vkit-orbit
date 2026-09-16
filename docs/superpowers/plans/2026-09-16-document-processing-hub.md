# Document Processing Hub Implementation Plan

> **For agentic workers:** Follow the execution mode selected at approval. Orchestrated modes use `/home/alfarizi/.config/opencode/workflows/planned-execution.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the domain-neutral Go/River boilerplate with a production-grade Document Processing Hub using TanStack Start, same-origin tRPC, standalone Elysia, PostgreSQL, BullMQ/Redis, MinIO, and Socket.IO invalidation events.

**Architecture:** PostgreSQL owns business truth, idempotency, audit history, processing state, webhook schedules, and transactional queue intents. A TypeScript worker relays deterministic BullMQ jobs and executes resumable stages; web and public API transports share application commands and query services without sharing transport concerns. This program is split into six acceptance-gated batches so each subsystem becomes working, reviewable software before dependent work begins.

**Tech Stack:** Bun 1.3.14 package baseline, TypeScript 5.9, Prisma 6/PostgreSQL 16, BullMQ/Redis, AWS S3 SDK/MinIO, TanStack Start/React 19, tRPC v11, Elysia 1.4, Socket.IO 4, Zod, Testcontainers, Playwright, Tailwind 4, shadcn/ui.

## Discovery Evidence

- Inspected `README.md`, `AGENTS.md`, every relevant `.agent/**/*.md`, `Taskfile.yml`, `package.json`, `turbo.json`, `.env.example`, `docker-compose.yml`, and current runtime package manifests.
- `packages/database/prisma/schema.prisma` contains only generator and datasource declarations. The only existing Prisma migration is River-specific: `packages/database/prisma/migrations/20260723000000_move_river_helper_to_schema/migration.sql`.
- `packages/application/src/index.ts` is empty. There is no `packages/query`, TypeScript worker package, tRPC dependency, Testcontainers harness, or Playwright harness.
- `packages/queue/src/river.ts`, `apps/worker/main.go`, `apps/migrate/main.go`, and `apps/scheduler/src/runtime.ts` implement the current River path that this plan removes rather than adapts.
- `apps/api/src/app.ts` already composes named Elysia plugins and OpenAPI checks. Existing `/api/v1` and embedded-web assumptions must change to standalone `/v1`, `/openapi.json`, and `/docs`.
- `apps/web/src/app/api/$.ts` embeds Elysia and `apps/web/src/lib/api.ts` is an Eden browser client. Both are removal targets; TanStack directory-first routing and generated `routeTree.gen.ts` remain.
- `packages/storage` already validates root-prefixed keys and supports S3 `put`/`get`; it lacks signed upload/download URLs, `HEAD`, and deletion.
- `packages/realtime` and `apps/realtime` already provide typed events, tickets, rooms, and a private publisher. Their contracts must become workspace/document invalidation contracts.
- Confirmed commands: `task quality`, `task build`, `bun test <paths>`, `bun --cwd <workspace> run check-types`, `bun run check:architecture`, `docker compose config`, and `docker compose up --build -d`.
- Baseline on 2026-09-16: `task quality` passed 101 Bun tests and all Go tests; `task build` passed. ESLint reports ten existing `no-explicit-any` warnings and no errors.
- Docker Compose 5.4.0 and Docker Engine 29.7.2 are available. Local Bun is 1.4.2 while `package.json` pins `bun@1.3.14`; implementation must remain compatible with the pinned baseline and CI must use the pin.
- Required local services are PostgreSQL, Redis, and MinIO. Integration tests provision isolated PostgreSQL and Redis containers and must stop them in `afterAll`, even after assertion failure.
- Known uncertainty: Bun support in the chosen Testcontainers package must be proven in Task 2 before domain integration work. If container startup fails under Bun, use Docker Compose test services invoked by a Bun test harness; do not weaken real-boundary coverage.
- Known uncertainty: TanStack Start's current server-route adapter API for tRPC must be proven in Task 10 with a focused request test before removing the embedded Elysia adapter.

## Verification Architecture

- Pure parsers, state transitions, deterministic IDs, permission mapping, retry classification, and redaction use Bun unit tests.
- Database invariants, workspace isolation, leases, idempotency, audits, and outbox atomicity use real PostgreSQL integration tests against migrated schemas.
- Queue relay, duplicate execution, delayed retries, scheduler behavior, Redis restart, and Redis-loss reconstruction use real PostgreSQL plus real Redis containers.
- Storage upload confirmation and signed result URLs use a real MinIO service in the Compose smoke boundary; AWS client unit tests only diagnose command construction.
- Public API behavior uses `createApp().handle()` for focused contracts and standalone network requests in Compose for final acceptance.
- Web procedures use direct tRPC caller tests for policy and Playwright against the real web, PostgreSQL, Redis, worker, API, realtime, and MinIO stack for user journeys.
- Realtime tests prove events only invalidate/refetch; authoritative state assertions always come from tRPC or `/v1` after the event.
- The final boundary where fakes stop is `task compose:smoke`: real containers, migrations, upload to MinIO, BullMQ processing, PostgreSQL result, Socket.IO invalidation, signed download, and webhook delivery.
- A skipped container or browser test is not acceptance evidence. Container-dependent gates report `PASS`, `FAIL`, or `BLOCKED`; only `PASS` advances the batch.

## Global Constraints

- The browser uses same-origin tRPC only and never calls Elysia `/v1` or imports server credentials.
- `apps/api` is the standalone public Elysia server; it is not a web proxy.
- Every Elysia HTTP operation has one handler file exporting exactly one `*Handler` with concrete schemas and OpenAPI metadata.
- Only `packages/database` creates Prisma clients. HTTP handlers never perform Prisma writes.
- PostgreSQL is the source of truth; Redis/BullMQ only owns delivery, scheduling, concurrency, retry, and delay.
- Queue intent is committed through PostgreSQL transactional outbox and published with deterministic BullMQ `jobId` values.
- Worker handlers receive parsed typed payloads, and BullMQ completion is never treated as business completion.
- BullMQ owns safe deterministic infrastructure retries. PostgreSQL owns webhook schedules, ambiguity, leases, recovery, and operator retries.
- Redis uses `appendonly yes`, `appendfsync everysec`, `maxmemory-policy noeviction`, a pinned image, health check, and persistent volume.
- Initial document support is `.txt` and `.md`; OCR, PDF/DOCX, AI, malware scanning, billing, arbitrary workflows, and compatibility layers are excluded.
- Realtime payloads are invalidation signals; clients refetch authoritative state after events or reconnects.
- Every behavior change starts with a focused failing test and each task ends with its planned conventional commit.
- Before final completion run focused tests, `task quality`, `task build`, `task compose:smoke`, and `git diff --check`.

---

## Execution Batches

### Batch 1: Durable Product Foundation

- Goal: Establish the TypeScript-only runtime skeleton, complete PostgreSQL domain schema, and authenticated workspace application boundary.
- Tasks: 1-3
- Depends on: None
- Acceptance gate: `bun test scripts packages/config packages/database packages/application packages/query && bun run check:architecture && bun run check-types`
- External gates: `GATE-CONTAINERS`, blocked scope Task 2 integration acceptance, evidence is successful PostgreSQL container migration and query, owner is local Docker Engine, resolution is a non-skipped passing `packages/database/test/integration/database.test.ts` run.
- Verification impact: Establishes generated Prisma types, package graph, runtime commands, and architecture rules used by every later batch.

### Batch 2: Upload and Durable Commands

- Goal: Complete storage primitives and atomic document upload, idempotency, audit, and processing-submission behavior.
- Tasks: 4-5
- Depends on: Batch 1
- Acceptance gate: `bun test packages/storage packages/application packages/query && bun --cwd packages/application run check-types`
- External gates: `GATE-CONTAINERS` from Batch 1.
- Verification impact: Changes application commands and schema behavior introduced in Batch 1; rerun its database integration suite.

### Batch 3: BullMQ Processing and Recovery

- Goal: Process documents end-to-end with typed BullMQ contracts, transactional relay, staged workers, durable webhooks, schedulers, and Redis-loss recovery.
- Tasks: 6-8
- Depends on: Batch 2
- Acceptance gate: `bun test packages/queue apps/worker apps/scheduler packages/application/test/integration && bun --cwd apps/worker run check-types && bun --cwd apps/scheduler run check-types`
- External gates: `GATE-REDIS`, blocked scope Tasks 7-8 integration acceptance, evidence is a passing real Redis restart/flush recovery suite, owner is local Docker Engine, resolution is non-skipped completion of `apps/worker/test/integration/recovery.test.ts`.
- Verification impact: Can invalidate domain transitions, outbox records, storage artifacts, and generated Prisma client from Batches 1-2.

### Batch 4: Public and Same-Origin Transports

- Goal: Expose the same application behavior through standalone Elysia `/v1` and authenticated same-origin tRPC without cross-transport leakage.
- Tasks: 9-10
- Depends on: Batch 3
- Acceptance gate: `bun test apps/api apps/web/src/trpc apps/web/src/app/trpc && bun --cwd apps/api run check-types && bun --cwd apps/web run check-types && bun run check:architecture`
- External gates: None.
- Verification impact: Can invalidate API/OpenAPI contracts, session behavior, application command mappings, and architecture checks.

### Batch 5: Product Workspace UI

- Goal: Deliver accessible browser workflows for authentication, document processing, developer settings, activity, workspace settings, and realtime refetch.
- Tasks: 11-13
- Depends on: Batch 4
- Acceptance gate: `bun test apps/web/src/app apps/web/src/components apps/web/src/lib && bun --cwd apps/web run check-types && bun --cwd apps/web run build`
- External gates: None.
- Verification impact: Regenerates the TanStack route tree and can invalidate tRPC query keys, session guards, and realtime behavior from Batch 4.

### Batch 6: Production Verification (Final)

- Goal: Prove observability, deployment, recovery, and all user/API journeys across the complete real stack.
- Tasks: 14-15
- Depends on: Batch 5
- Acceptance gate: `task quality && task build && task compose:smoke && git diff --check`, followed by a spec-to-evidence audit with all ten success criteria marked `PASS`.
- External gates: `GATE-COMPOSE`, blocked scope final acceptance only, evidence is healthy real Compose services and passing Playwright/smoke scripts, owner is local Docker Engine plus free ports 4100-4102, resolution is `task compose:smoke` exit code 0 with no skipped scenarios.
- Verification impact: Deployment/config changes can invalidate every earlier build, integration test, generated route tree, migration, runtime health probe, and container image.

## File Structure

Expected ownership is flexible unless a task states otherwise:

```text
packages/database/prisma/                 product schema and migrations
packages/database/test/integration/       migrated PostgreSQL harness
packages/application/src/auth/            session, password, and permission commands
packages/application/src/api-keys/        create, authenticate, and revoke API keys
packages/application/src/workspaces/      workspace and membership commands
packages/application/src/documents/       upload and processing commands/state machine
packages/application/src/outbox/          claims, publication outcomes, recovery intents
packages/application/src/webhooks/        endpoints and durable delivery attempts
packages/application/src/audit/           allowlisted transactional audit writes
packages/query/src/                        workspace-scoped read DTOs and pagination
packages/queue/src/contracts/              one versioned BullMQ contract per file
packages/queue/src/                        queue names, Redis factories, IDs, defaults
packages/storage/src/                      signed URL, metadata, and deletion operations
apps/worker/src/handlers/                  one typed handler per job contract
apps/worker/src/relay/                     outbox claim and publication loop
apps/scheduler/src/                        stable BullMQ Job Scheduler installation
apps/api/src/handlers/v1/                  one public Elysia operation per file
apps/api/src/plugins/                      API key, idempotency, errors, request context
apps/web/src/trpc/                         routers, context, procedures, caller tests
apps/web/src/app/trpc/$.ts                 same-origin tRPC server adapter
apps/web/src/app/_authenticated/           guarded product routes
apps/web/e2e/                              Playwright journeys
docs/runbooks/                             operational diagnosis and recovery
```

### Task 1: TypeScript Runtime Cutover and Architecture Contracts

**Files:**

- Modify: `package.json`, `bun.lock`, `turbo.json`, `Taskfile.yml`, `.env.example`, `docker-compose.yml`
- Modify: `packages/config/src/{api,worker,scheduler,index}.ts` and matching tests
- Create: `packages/config/src/redis.ts`, `packages/config/src/redis.test.ts`, `config/redis.yaml`
- Create: `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/src/main.ts`
- Create: `apps/migrate/package.json`, `apps/migrate/src/main.ts`
- Create: `packages/query/package.json`, `packages/query/tsconfig.json`, `packages/query/src/index.ts`
- Modify: `scripts/check-architecture.ts`, `scripts/check-architecture.test.ts`, `scripts/check-taskfile.test.ts`, `scripts/dockerfiles.test.ts`
- Delete: `apps/worker/main.go`, `apps/worker/main_test.go`, `apps/migrate/main.go`, `apps/migrate/main_test.go`, `go.mod`, `go.sum`, and River-only `internal/` sources
- Scope lock: flexible - exact config modules and test placement may follow existing package conventions, but all Go/River runtime ownership must be removed.

**Interfaces:**

- Consumes: Existing YAML loader contract from `packages/config/src/loader.ts`.
- Produces: `redisConfig`, TypeScript `apps/worker` and `apps/migrate` workspaces, `task dev:*`, `task start:*`, `task test`, `task quality`, and `task build` with no Go/River command.
- Blocked by: None.

**Acceptance evidence:**

- Behavior: Architecture tests reject River packages, Go worker files, web `/v1` calls, browser server imports, Prisma outside `packages/database`, and multi-handler Elysia operation files.
- Integration: `docker compose config` proves PostgreSQL, pinned Redis, MinIO, migrate, web, API, worker, scheduler, and realtime topology parses.
- Evidence invalidated by: Root scripts, package manifests, config schemas, Dockerfiles, or Compose changes.

- [ ] **Step 1: Write failing architecture and task tests** asserting the new runtime inventory and forbidden imports.

```ts
expect(checkArchitecture(root)).toContain("apps/web/src/lib/bad-client.ts: browser code must not call the public /v1 API");
expect(taskfile).not.toContain("go test");
expect(taskfile).not.toContain("River");
expect(compose.services.redis.command).toEqual([
	"redis-server",
	"--appendonly",
	"yes",
	"--appendfsync",
	"everysec",
	"--maxmemory-policy",
	"noeviction",
]);
```

- [ ] **Step 2: Run the focused tests and verify failure**.

Run: `bun test scripts/check-architecture.test.ts scripts/check-taskfile.test.ts scripts/dockerfiles.test.ts packages/config/src`

Expected: FAIL because the repository still declares Go/River and has no Redis config.

- [ ] **Step 3: Replace the runtime skeleton and configuration** with TypeScript workspaces and these required Redis fields.

```ts
export type RedisConfig = {
	url: string;
	keyPrefix: string;
	connectTimeoutMs: number;
	maxRetriesPerRequest: null;
};
```

Keep `apps/migrate/src/main.ts` limited to executing `prisma migrate deploy`; BullMQ has no database migration step.

- [ ] **Step 4: Regenerate the lockfile and verify the cutover**.

Run: `bun install && bun test scripts packages/config && docker compose config && bun run check:architecture && bun run check-types`

Expected: PASS with no Go or River command in active runtime paths.

- [ ] **Step 5: Commit**.

```bash
git add package.json bun.lock turbo.json Taskfile.yml .env.example docker-compose.yml config packages/config packages/query apps/worker apps/migrate scripts go.mod go.sum internal
git commit -m "refactor: replace river runtimes with typescript"
```

### Task 2: PostgreSQL Domain Schema and Integration Harness

**Files:**

- Modify: `packages/database/prisma/schema.prisma`, `packages/database/package.json`, `packages/database/src/index.ts`
- Delete: `packages/database/prisma/migrations/20260723000000_move_river_helper_to_schema/migration.sql`
- Create: `packages/database/prisma/migrations/20260916000000_document_processing_hub/migration.sql`
- Create: `packages/database/test/integration/harness.ts`, `packages/database/test/integration/database.test.ts`
- Scope lock: exact for model names, enum states, tenant-qualified constraints, and queue-outbox uniqueness because all later packages consume generated names.

**Interfaces:**

- Consumes: `DATABASE_URL` and Prisma 6 migration/client generation.
- Produces: `Workspace`, `WorkspaceMember`, `User`, `Session`, `ApiKey`, `Document`, `ProcessingRun`, `ProcessingAttempt`, `DocumentArtifact`, `WebhookEndpoint`, `WebhookDelivery`, `AuditLog`, `IdempotencyRecord`, and `QueueOutbox` Prisma models; `withPostgres()` integration helper.
- Blocked by: Task 1 and `GATE-CONTAINERS`.

**Acceptance evidence:**

- Behavior: Prisma schema validation and generated client typecheck.
- Integration: Fresh PostgreSQL receives the migration; duplicate workspace-qualified relations, idempotency keys, deterministic outbox IDs, and active processing revisions are rejected by database constraints.
- Evidence invalidated by: Prisma schema, migration SQL, Prisma version, or database harness changes.

- [ ] **Step 1: Write a failing migrated-database test** for tenant isolation and unique durable identities.

```ts
test("enforces workspace-qualified document and outbox identities", async () => {
	await withPostgres(async (db) => {
		const first = await seedWorkspace(db, "ws_one");
		const second = await seedWorkspace(db, "ws_two");
		await expect(linkRunToDocument(db, second.id, first.documentId)).rejects.toThrow();
		await expect(insertOutboxTwice(db, first.id, "document.validate.v1:run_1:1")).rejects.toThrow();
	});
});
```

- [ ] **Step 2: Run and verify the harness fails before schema implementation**.

Run: `bun test packages/database/test/integration/database.test.ts`

Expected: FAIL because models and migration do not exist. If Bun cannot start Testcontainers, record `GATE-CONTAINERS` as `BLOCKED` and implement the documented Compose-backed harness before proceeding.

- [ ] **Step 3: Add the complete schema and initial product migration** including indexes for workspace/status/created-at lists, due outbox records, due webhook attempts, and expired processing leases.

```prisma
enum DocumentStatus {
  UPLOADING
  READY
}

enum ProcessingStatus {
  QUEUED
  VALIDATING
  ANALYZING
  FINALIZING
  COMPLETED
  FAILED
  CANCELED
}

enum QueueOutboxStatus {
  PENDING
  CLAIMED
  PUBLISHED
  FAILED
}
```

Use compound foreign keys wherever a child carries `workspaceId` plus a parent identifier.

- [ ] **Step 4: Generate Prisma and run schema plus real PostgreSQL checks**.

Run: `bun --cwd packages/database run db:generate && bunx prisma validate --schema packages/database/prisma/schema.prisma && bun test packages/database`

Expected: PASS with the integration test executed, not skipped.

- [ ] **Step 5: Commit**.

```bash
git add packages/database
git commit -m "feat(database): add document processing domain"
```

### Task 3: Authentication, RBAC, Audit, and Query Boundaries

**Files:**

- Modify: `packages/application/package.json`, `packages/application/src/index.ts`
- Create: `packages/application/src/auth/{password,session,permissions}.ts` and tests
- Create: `packages/application/src/api-keys/{create-key,authenticate-key,revoke-key}.ts` and tests
- Create: `packages/application/src/workspaces/{create-workspace,change-membership}.ts` and tests
- Create: `packages/application/src/audit/write-audit-log.ts` and test
- Create: `packages/application/src/shared/{errors,transaction}.ts`
- Modify: `packages/query/package.json`, `packages/query/src/index.ts`
- Create: `packages/query/src/{documents,processing-runs,api-keys,webhooks,audit}.ts` and tests
- Create: `packages/application/test/integration/auth.test.ts`, `packages/query/test/integration/workspace-isolation.test.ts`
- Scope lock: flexible.

**Interfaces:**

- Consumes: Task 2 Prisma models.
- Produces: `hashPassword`, `verifyPassword`, `createSession`, `authenticateSession`, `revokeSession`, `requirePermission`, `createApiKey`, `authenticateApiKey`, `revokeApiKey`, `createWorkspace`, `changeWorkspaceMembership`, `writeAuditLog`, and workspace-scoped query functions returning JSON-safe DTOs.
- Blocked by: Task 2.

**Acceptance evidence:**

- Behavior: Argon2id hashing, SHA-256 session/API-key secret storage, one-time API-key plaintext return, expiry/revocation, and permission-code mapping pass unit tests.
- Integration: Real PostgreSQL proves plaintext tokens are absent, audit writes share mutation transactions, and cross-workspace query identifiers return not-found results.
- Evidence invalidated by: Auth commands, permission maps, query predicates, DTO selections, or schema constraints.

- [ ] **Step 1: Write failing auth and isolation tests**.

```ts
test("stores only the session token digest", async () => {
	const session = await createSession({ userId, userAgent: "test", ipAddress: "127.0.0.1" });
	expect(session.token).toMatch(/^ses_/);
	expect(await prisma.session.findFirst({ where: { tokenHash: session.token } })).toBeNull();
	expect(await authenticateSession(session.token)).toMatchObject({ userId });
});

test("returns an API key secret once and stores only its digest", async () => {
	const created = await createApiKey(scope, { name: "automation", scopes: ["documents:read"] });
	expect(created.secret).toMatch(/^dph_/);
	expect(await prisma.apiKey.findFirst({ where: { secretHash: created.secret } })).toBeNull();
});

test("does not reveal another workspace document", async () => {
	await expect(getDocument({ workspaceId: secondWorkspace.id, documentId: firstDocument.id })).resolves.toBeNull();
});
```

- [ ] **Step 2: Run focused tests and verify expected failures**.

Run: `bun test packages/application/src/auth packages/application/test/integration/auth.test.ts packages/query/test/integration/workspace-isolation.test.ts`

Expected: FAIL because auth commands and query package behavior are absent.

- [ ] **Step 3: Implement minimal auth, permission, audit, and query services** with permission codes from the approved design and cursor inputs shaped as:

```ts
export type PageInput = { size: number; after?: string; before?: string };
export type WorkspaceScope = { workspaceId: string; principalId: string };
```

All resource queries combine `workspaceId` and resource ID in one predicate.

- [ ] **Step 4: Run unit, database integration, and type checks**.

Run: `bun test packages/application packages/query && bun --cwd packages/application run check-types && bun --cwd packages/query run check-types`

Expected: PASS.

- [ ] **Step 5: Commit**.

```bash
git add packages/application packages/query
git commit -m "feat: add workspace authentication and queries"
```

### Task 4: S3 Upload and Result Storage Operations

**Files:**

- Modify: `packages/storage/src/{client,types,index}.ts`, `packages/storage/package.json`
- Create: `packages/storage/src/presign.test.ts`, `packages/storage/src/metadata.test.ts`
- Modify: `packages/storage/src/keys.ts`, `packages/storage/src/keys.test.ts`
- Scope lock: flexible.

**Interfaces:**

- Consumes: Existing `StorageConfig` and root-prefix key guard.
- Produces: `createUploadUrl`, `createDownloadUrl`, `head`, `delete`, `put`, `get`, `sourceObjectKey`, and `resultObjectKey`.
- Blocked by: Task 1 config and Task 2 identifiers.

**Acceptance evidence:**

- Behavior: AWS command tests prove bounded expiries, content-type/length metadata, server-generated workspace prefixes, and key rejection.
- Integration: Deferred to Task 15 MinIO smoke because signed URL fidelity depends on a real S3-compatible server.
- Evidence invalidated by: Storage client commands, key format, config, or AWS SDK version.

- [ ] **Step 1: Write failing command and key tests**.

```ts
expect(sourceObjectKey({ workspaceId: "ws_1", documentId: "doc_1", artifactId: "art_1" })).toBe(
	"uploads/workspaces/ws_1/documents/doc_1/source/art_1",
);
expect(resultObjectKey({ workspaceId: "ws_1", documentId: "doc_1", runId: "run_1", artifactId: "art_2" })).toBe(
	"uploads/workspaces/ws_1/documents/doc_1/runs/run_1/results/art_2.json",
);
```

- [ ] **Step 2: Run and verify failure**.

Run: `bun test packages/storage`

Expected: FAIL because signed URL, metadata, deletion, and product key helpers are absent.

- [ ] **Step 3: Implement the storage operations** using `HeadObjectCommand`, `DeleteObjectCommand`, and `@aws-sdk/s3-request-presigner`, with upload URLs capped at 15 minutes and downloads capped at 5 minutes.

- [ ] **Step 4: Run storage tests and typecheck**.

Run: `bun test packages/storage && bun --cwd packages/storage run check-types`

Expected: PASS.

- [ ] **Step 5: Commit**.

```bash
git add packages/storage bun.lock
git commit -m "feat(storage): add document artifact operations"
```

### Task 5: Document Lifecycle, Idempotency, and Transactional Outbox

**Files:**

- Create: `packages/application/src/documents/{create-upload,confirm-upload,submit-processing,cancel-processing,retry-processing,state-machine}.ts` and tests
- Create: `packages/application/src/idempotency/execute-idempotent.ts` and tests
- Create: `packages/application/src/outbox/{enqueue-intent,claim-batch,record-publication}.ts` and tests
- Create: `packages/application/test/integration/document-lifecycle.test.ts`, `packages/application/test/integration/outbox.test.ts`
- Modify: `packages/application/src/index.ts`, `packages/query/src/documents.ts`, `packages/query/src/processing-runs.ts`
- Scope lock: exact for state transitions and transactional coupling.

**Interfaces:**

- Consumes: Task 2 schema, Task 3 scope/audit services, Task 4 storage interface.
- Produces: `createDocumentUpload`, `confirmDocumentUpload`, `submitProcessingRun`, `cancelProcessingRun`, `retryProcessingRun`, `claimOutboxBatch`, `markOutboxPublished`, and `markOutboxFailed`.
- Blocked by: Tasks 3-4.

**Acceptance evidence:**

- Behavior: Transition tests reject stale revisions, invalid status changes, unsupported content types, oversized uploads, and retrying non-failed runs.
- Integration: Real PostgreSQL proves command state, audit, idempotency result, and queue intent commit or roll back together under concurrency.
- Evidence invalidated by: State machine, transaction helper, outbox schema, idempotency hashing, or audit writes.

- [ ] **Step 1: Write failing transition and transaction tests**.

```ts
test("submits a ready document and queue intent atomically", async () => {
	const run = await submitProcessingRun(scope, { documentId, idempotencyKey: "submit-1" });
	expect(run.status).toBe("QUEUED");
	expect(await findOutbox(`document.validate.v1:${run.id}:1`)).toMatchObject({ status: "PENDING" });
	expect(await findAudit("processing.submitted", run.id)).not.toBeNull();
});

test("same key and different request conflicts", async () => {
	await executeIdempotent(scope, "submit", "key-1", { documentId: "doc_1" }, action);
	await expect(executeIdempotent(scope, "submit", "key-1", { documentId: "doc_2" }, action)).rejects.toMatchObject({
		code: "IDEMPOTENCY_CONFLICT",
	});
});
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test packages/application/src/documents packages/application/test/integration/document-lifecycle.test.ts packages/application/test/integration/outbox.test.ts`

Expected: FAIL because lifecycle commands and outbox transactions are absent.

- [ ] **Step 3: Implement minimal commands and state guards**. Canonical request hashes use sorted JSON plus SHA-256; outbox IDs use `<contract>:<businessId>:<revision>` and inserts are conflict-safe only when payload bytes match.

- [ ] **Step 4: Run application and query suites against PostgreSQL**.

Run: `bun test packages/application packages/query`

Expected: PASS with concurrent idempotency and rollback assertions.

- [ ] **Step 5: Commit**.

```bash
git add packages/application packages/query
git commit -m "feat: add durable document lifecycle"
```

### Task 6: BullMQ Contracts and Queue Runtime

**Files:**

- Modify: `packages/queue/package.json`, `packages/queue/src/index.ts`
- Delete: `packages/queue/src/river.ts`, `packages/queue/src/river.test.ts`
- Create: `packages/queue/src/{queues,job-id,redis,defaults}.ts` and tests
- Create: `packages/queue/src/contracts/{document-validate-v1,document-analyze-v1,document-finalize-v1,webhook-deliver-v1,document-recover-v1,document-cleanup-v1,notification-publish-v1}.ts` and tests
- Scope lock: exact for queue names, job names, and JSON payload shapes because they are persisted cross-runtime contracts.

**Interfaces:**

- Consumes: Task 1 Redis config and Task 5 outbox contract strings.
- Produces: `jobContracts`, `parseJobPayload`, `createJobId`, `createQueue`, `createWorkerConnection`, and queue defaults.
- Blocked by: Task 5.

**Acceptance evidence:**

- Behavior: Contract tests reject unknown fields, invalid revisions, blank IDs, non-versioned names, and colons in generated BullMQ IDs.
- Integration: Not required; this task proves pure contracts and adapter construction. Real Redis behavior is Task 7.
- Evidence invalidated by: Queue names, payload schemas, ID encoding, connection options, retry, or retention defaults.

- [ ] **Step 1: Replace River tests with failing BullMQ contract tests**.

```ts
expect(documentValidateV1.schema.parse({ workspaceId: "ws_1", runId: "run_1", revision: 1 })).toEqual({
	workspaceId: "ws_1",
	runId: "run_1",
	revision: 1,
});
expect(createJobId(documentValidateV1, "run_1", 1)).toBe("document.validate.v1__run_1__1");
```

- [ ] **Step 2: Run and verify failure**.

Run: `bun test packages/queue`

Expected: FAIL because BullMQ contracts do not exist.

- [ ] **Step 3: Implement contracts and runtime factories** with `maxRetriesPerRequest: null` for worker connections, bounded exponential backoff for deterministic stages, and retention longer than outbox claim/recovery horizons.

- [ ] **Step 4: Run queue tests and typecheck**.

Run: `bun test packages/queue && bun --cwd packages/queue run check-types`

Expected: PASS and package manifest contains no River dependency.

- [ ] **Step 5: Commit**.

```bash
git add packages/queue bun.lock
git commit -m "feat(queue): add bullmq contracts"
```

### Task 7: Outbox Relay and Staged Document Worker

**Files:**

- Create: `apps/worker/src/{runtime,server,shutdown}.ts` and tests
- Create: `apps/worker/src/relay/{relay,loop}.ts` and tests
- Create: `apps/worker/src/handlers/{document-validate-v1,document-analyze-v1,document-finalize-v1,notification-publish-v1}.ts` and tests
- Create: `packages/application/src/processing/{claim-stage,complete-validation,complete-analysis,complete-finalization,fail-stage}.ts` and tests
- Create: `apps/worker/test/integration/{relay,processing}.test.ts`
- Modify: `apps/worker/src/main.ts`, `packages/application/src/index.ts`
- Scope lock: exact for lease/state transition order and parsed-handler boundary.

**Interfaces:**

- Consumes: Task 5 outbox claims/commands, Task 6 contracts, Task 4 storage operations.
- Produces: `runOutboxRelay`, typed `JobHandler<T>`, stage completion commands, report JSON artifact, worker liveness/readiness, and bounded shutdown.
- Blocked by: Task 6 and `GATE-REDIS`.

**Acceptance evidence:**

- Behavior: Unit tests prove report metrics, heading extraction, normalized title, reading time, typed payload parsing, and `SUCCESS|NO_OP|RETRYABLE|TERMINAL|UNKNOWN` classification.
- Integration: Real PostgreSQL/Redis proves concurrent relays, crash after `queue.add`, duplicate jobs, stale revisions, worker restart, and one result artifact.
- Evidence invalidated by: Relay claim SQL, BullMQ defaults, stage handlers, lease commands, processing algorithms, or storage writes.

- [ ] **Step 1: Write failing processor and relay tests**.

```ts
test("replaying finalization creates one result artifact", async () => {
	await enqueueFinalize(run.id, 1);
	await enqueueFinalize(run.id, 1);
	await waitForRun(run.id, "COMPLETED");
	expect(await prisma.documentArtifact.count({ where: { processingRunId: run.id, kind: "RESULT" } })).toBe(1);
});

test("relay crash window republishes the same BullMQ job", async () => {
	await relayOnce({ afterAdd: () => Promise.reject(new Error("simulated crash")) });
	await relayOnce();
	expect(await queue.getJobs()).toHaveLength(1);
});
```

- [ ] **Step 2: Run and verify failures against real PostgreSQL and Redis**.

Run: `bun test apps/worker/src apps/worker/test/integration/relay.test.ts apps/worker/test/integration/processing.test.ts`

Expected: FAIL because relay and handlers are absent; no test may skip Redis.

- [ ] **Step 3: Implement lease-based commands, processor functions, relay, handlers, health server, and shutdown**. Handlers parse payloads before invocation and re-read authoritative run state before every mutation.

- [ ] **Step 4: Run worker integration, application regression, and type checks**.

Run: `bun test apps/worker packages/application packages/queue && bun --cwd apps/worker run check-types`

Expected: PASS with duplicate and crash-window assertions.

- [ ] **Step 5: Commit**.

```bash
git add apps/worker packages/application
git commit -m "feat(worker): process documents through bullmq"
```

### Task 8: Durable Webhooks, Schedulers, and Redis-Loss Recovery

**Files:**

- Create: `packages/application/src/webhooks/{create-endpoint,update-endpoint,rotate-secret,prepare-delivery,record-attempt}.ts` and tests
- Create: `packages/application/src/recovery/{recover-processing,recover-webhooks,cleanup-documents}.ts` and tests
- Create: `apps/worker/src/handlers/{webhook-deliver-v1,document-recover-v1,document-cleanup-v1}.ts` and tests
- Modify: `apps/scheduler/src/{runtime,main}.ts`, `apps/scheduler/src/{runtime,schedules}.test.ts`
- Create: `apps/worker/test/integration/{webhook,recovery}.test.ts`
- Scope lock: exact for stored webhook bytes, signature input, retry ownership, and recovery eligibility.

**Interfaces:**

- Consumes: Task 7 worker/runtime and Task 6 contracts.
- Produces: durable webhook endpoints/deliveries, `signWebhook`, one-attempt delivery handler, recovery commands, cleanup command, and stable BullMQ Job Scheduler IDs.
- Blocked by: Task 7 and `GATE-REDIS`.

**Acceptance evidence:**

- Behavior: Unit tests prove HMAC input, identical retry bytes, retry/terminal/unknown classification, bounded backoff, and due-record selection.
- Integration: Real PostgreSQL/Redis proves Redis restart, complete Redis flush, recovery reconstruction, due webhook recreation, and completed/canceled no-ops.
- Evidence invalidated by: Webhook serializer, retry classifier, recovery query, scheduler IDs, queue retention, or processing leases.

- [ ] **Step 1: Write failing webhook and recovery tests**.

```ts
test("all retries send the stored envelope bytes", async () => {
	const first = await deliverOnce(delivery.id, failingReceiver);
	const second = await deliverOnce(delivery.id, succeedingReceiver);
	expect(second.requestBody).toEqual(first.requestBody);
	expect(second.signatureInput).toEqual(first.signatureInput);
});

test("rebuilds an analyzing run after Redis is flushed", async () => {
	await redis.flushall();
	await recoverProcessing({ limit: 100 });
	await relayOnce();
	expect(await queue.getJob(createJobId(documentAnalyzeV1, run.id, run.stageRevision))).not.toBeNull();
});
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test packages/application/src/webhooks packages/application/src/recovery apps/worker/test/integration/webhook.test.ts apps/worker/test/integration/recovery.test.ts apps/scheduler/src`

Expected: FAIL because durable delivery and recovery are absent.

- [ ] **Step 3: Implement webhook, recovery, cleanup, and scheduler behavior**. Each webhook BullMQ job performs one database-recorded attempt; retryable results create a delayed outbox intent and return successfully.

- [ ] **Step 4: Run real restart/flush recovery and scheduler checks**.

Run: `bun test apps/worker/test/integration apps/scheduler packages/application/src/webhooks packages/application/src/recovery`

Expected: PASS with no skipped container tests.

- [ ] **Step 5: Commit**.

```bash
git add packages/application apps/worker apps/scheduler
git commit -m "feat: add durable recovery and webhooks"
```

### Task 9: Standalone Public Elysia API

**Files:**

- Modify: `apps/api/package.json`, `apps/api/src/{app,runtime,server,openapi}.ts`, existing plugins and tests
- Create: `apps/api/src/plugins/{api-key,idempotency}.ts` and tests
- Create: `apps/api/src/handlers/v1/document-uploads/create.ts`
- Create: one file per approved `/v1` confirmation, processing, cancellation, retry, list, detail, run, and result operation with colocated tests
- Modify: `apps/api/src/routes/{index,create-routes}.ts`, `apps/api/src/routes/internal/worker-events.ts`
- Modify: `scripts/check-architecture.ts`, `apps/api/src/openapi/contract.test.ts`
- Scope lock: exact for one operation per file, exported handler count, route paths, error codes, and OpenAPI parity.

**Interfaces:**

- Consumes: Tasks 3, 5, and 8 application/query functions.
- Produces: standalone `/v1`, `/health/live`, `/health/ready`, `/openapi.json`, `/docs`, and authenticated `/internal/worker-events` HTTP contracts.
- Blocked by: Task 8.

**Acceptance evidence:**

- Behavior: `app.handle()` tests prove API-key scope, mandatory idempotency headers, concrete schemas, stable error envelopes, and secret exclusion.
- Integration: API tests use real PostgreSQL for concurrent idempotency and cross-workspace denial; standalone process health is deferred to Compose final gate.
- Evidence invalidated by: Handler schemas, route composition, auth plugins, errors, OpenAPI generation, or application command signatures.

- [ ] **Step 1: Write failing handler inventory and API behavior tests**.

```ts
expect(publicOperations).toEqual([
	"POST /v1/document-uploads",
	"POST /v1/documents/:documentId/upload-confirmations",
	"POST /v1/documents/:documentId/processing-runs",
	"POST /v1/processing-runs/:runId/cancellations",
	"POST /v1/processing-runs/:runId/retries",
	"GET /v1/documents",
	"GET /v1/documents/:documentId",
	"GET /v1/processing-runs/:runId",
	"GET /v1/processing-runs/:runId/result",
]);
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test apps/api scripts/check-architecture.test.ts`

Expected: FAIL because current paths are embedded `/api/*`, handlers are grouped, and API-key behavior is absent.

- [ ] **Step 3: Implement standalone handlers and plugins**. Each handler exports one named `*Handler`, maps one command/query, documents every field/example/status, and never imports Prisma, BullMQ, Redis, or storage clients directly.

- [ ] **Step 4: Run API/OpenAPI/architecture checks**.

Run: `bun test apps/api && bun --cwd apps/api run check-types && bun run check:architecture`

Expected: PASS and generated OpenAPI paths exactly match the handler inventory.

- [ ] **Step 5: Commit**.

```bash
git add apps/api scripts/check-architecture.ts scripts/check-architecture.test.ts bun.lock
git commit -m "feat(api): expose document processing v1"
```

### Task 10: Same-Origin tRPC and Browser Session Transport

**Files:**

- Modify: `apps/web/package.json`, `apps/web/src/router.tsx`, `apps/web/src/components/query-provider.tsx`
- Delete: `apps/web/src/app/api/$.ts`, `apps/web/src/app/api/$.test.ts`, `apps/web/src/lib/api.ts`
- Create: `apps/web/src/trpc/{context,init,client,query-client}.ts`
- Create: `apps/web/src/trpc/routers/{auth,workspace,documents,processing-runs,api-keys,webhooks,audit,index}.ts` and tests
- Create: `apps/web/src/app/trpc/$.ts`, `apps/web/src/app/trpc/$.test.ts`
- Create: `apps/web/src/server/{cookies,origin}.ts` and tests
- Scope lock: exact for browser transport exclusivity and cookie security.

**Interfaces:**

- Consumes: Tasks 3, 5, and 8 commands/queries.
- Produces: `appRouter`, `AppRouter`, `createTRPCContext`, `publicProcedure`, `authenticatedProcedure`, `workspaceProcedure`, `permissionProcedure`, singleton browser tRPC client, and secure session cookie helpers.
- Blocked by: Task 9 only for shared error vocabulary; tRPC does not call Elysia.

**Acceptance evidence:**

- Behavior: Direct caller tests prove auth/RBAC/origin checks and procedure mappings; adapter tests prove same-origin `/trpc` requests and secure cookie flags.
- Integration: A migrated PostgreSQL caller test proves register/login/logout/session and document submission. Browser networking is final Playwright evidence.
- Evidence invalidated by: Router context, procedures, cookies, origin checks, app router, query client, or TanStack server adapter.

- [ ] **Step 1: Write failing tRPC caller and adapter tests**.

```ts
test("sets an opaque host-only session cookie", async () => {
	const response = await callLogin({ email: "owner@example.test", password: "correct horse battery staple" });
	expect(response.headers.get("set-cookie")).toMatch(/session=ses_/);
	expect(response.headers.get("set-cookie")).toMatch(/HttpOnly; Secure; SameSite=Lax/);
	expect(response.headers.get("set-cookie")).not.toMatch(/Domain=/);
});
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test apps/web/src/trpc apps/web/src/app/trpc apps/web/src/server`

Expected: FAIL because tRPC and session adapter do not exist.

- [ ] **Step 3: Implement tRPC context, routers, same-origin adapter, and client** using `httpBatchLink` for browser calls and direct application/query imports only in server modules.

- [ ] **Step 4: Remove Eden/embedded Elysia and verify boundaries**.

Run: `bun test apps/web/src/trpc apps/web/src/app/trpc apps/web/src/server && bun --cwd apps/web run check-types && bun run check:architecture`

Expected: PASS; `@elysia/eden`, `@repo/api`, and `/api/$` are absent from `apps/web`.

- [ ] **Step 5: Commit**.

```bash
git add apps/web scripts/check-architecture.ts scripts/check-architecture.test.ts bun.lock
git commit -m "feat(web): add same-origin trpc transport"
```

### Task 11: Authentication and Workspace Shell UI

**Files:**

- Modify: `apps/web/src/app/__root.tsx`, `apps/web/src/lib/{config,metadata}.ts`
- Replace: `apps/web/src/app/_public/index.tsx` and test
- Create: `apps/web/src/app/_public/{sign-in,register}/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/route.tsx`, `apps/web/src/app/_authenticated/app/route.tsx`, `apps/web/src/app/_authenticated/app/overview/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/app/-components/{app-shell,workspace-switcher,user-menu}.tsx` and tests
- Create/modify: shadcn primitives under `apps/web/src/components/ui/`
- Scope lock: flexible except route URLs and authenticated guard.

**Interfaces:**

- Consumes: Task 10 `auth` and `workspace` routers.
- Produces: sign-in/register flows, session guard, responsive application navigation, workspace switcher, and overview status summaries.
- Blocked by: Task 10.

**Acceptance evidence:**

- Behavior: Render tests prove labels, error states, keyboard controls, redirect behavior, and permission-aware navigation.
- Integration: Not required in this task; Task 15 Playwright proves browser cookies and navigation against real services.
- Evidence invalidated by: Auth router, route tree, layout, navigation, or session guard.

- [ ] **Step 1: Write failing route and accessibility tests** for signed-out redirects, form labels, invalid credentials, and mobile navigation.

```tsx
render(<SignInPage />);
expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
expect(screen.getByLabelText("Email address")).toHaveAttribute("autocomplete", "email");
expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test apps/web/src/app/_public apps/web/src/app/_authenticated`

Expected: FAIL because routes and product shell are absent.

- [ ] **Step 3: Implement the document-workbench shell** with explicit loading, empty, permission-denied, dependency-unavailable, and mutation error states; preserve visible focus and reduced-motion behavior.

- [ ] **Step 4: Regenerate routes and verify UI tests/build**.

Run: `bun test apps/web/src/app && bun --cwd apps/web run check-types && bun --cwd apps/web run build`

Expected: PASS with generated route tree containing `/sign-in`, `/register`, and `/app/overview` equivalents from pathless layout routing.

- [ ] **Step 5: Commit**.

```bash
git add apps/web
git commit -m "feat(web): add authenticated workspace shell"
```

### Task 12: Document Upload, List, Detail, and Run UI

**Files:**

- Create: `apps/web/src/app/_authenticated/app/documents/{index,new}/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/app/documents/$documentId/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/app/documents/$documentId/runs/$runId/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/app/documents/-components/{document-table,upload-workflow,status-timeline,result-summary,run-history}.tsx` and tests
- Create: `apps/web/src/lib/document-search.ts`, `apps/web/src/lib/document-search.test.ts`
- Scope lock: flexible except URL-owned search state and upload stage semantics.

**Interfaces:**

- Consumes: Task 10 document/run tRPC routers and Task 4 signed upload/download semantics.
- Produces: searchable cursor list, direct upload flow, confirmation/submission, milestone timeline, result report, download, cancel, and retry-as-new-run UI.
- Blocked by: Task 11.

**Acceptance evidence:**

- Behavior: Component tests prove `.txt`/`.md` acceptance, upload versus processing progress, URL validation, status transitions, failed-run retry, and responsive list behavior.
- Integration: Mock S3 is insufficient for acceptance; real upload and processing are Task 15 Playwright evidence.
- Evidence invalidated by: Document router, search schema, upload state machine, status vocabulary, or route tree.

- [ ] **Step 1: Write failing search and workflow tests**.

```ts
expect(documentSearchSchema.parse({ status: "FAILED", q: "quarterly", size: "25" })).toEqual({
	status: "FAILED",
	q: "quarterly",
	size: 25,
});
```

```tsx
expect(screen.getByText("Uploading document")).toBeVisible();
expect(screen.queryByText("Analyzing document")).not.toBeInTheDocument();
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test apps/web/src/app/_authenticated/app/documents apps/web/src/lib/document-search.test.ts`

Expected: FAIL because document routes and components are absent.

- [ ] **Step 3: Implement routes and components** using TanStack `validateSearch`, shared tRPC query options, server-generated signed URLs, and refetch after confirmation/submission.

- [ ] **Step 4: Regenerate route tree and verify**.

Run: `bun test apps/web/src/app/_authenticated/app/documents apps/web/src/lib && bun --cwd apps/web run check-types && bun --cwd apps/web run build`

Expected: PASS.

- [ ] **Step 5: Commit**.

```bash
git add apps/web
git commit -m "feat(web): add document processing workspace"
```

### Task 13: Developer Settings, Activity, Membership, and Realtime Refetch

**Files:**

- Create: `apps/web/src/app/_authenticated/app/developers/{api-keys,webhooks}/index.tsx` and tests
- Create: `apps/web/src/app/_authenticated/app/{activity,settings/workspace,settings/members}/index.tsx` and tests
- Modify: `apps/web/src/lib/realtime.ts`, `apps/web/src/lib/realtime.test.ts`
- Modify: `packages/realtime/src/{events,ticket}.ts` and tests
- Modify: `apps/realtime/src/{auth,server}.ts` and tests
- Scope lock: exact for secret-once display and invalidation-only realtime payloads.

**Interfaces:**

- Consumes: Task 10 API-key/webhook/audit/workspace routers and Task 8 notification events.
- Produces: API-key lifecycle, webhook lifecycle/delivery history, audit activity, workspace/member settings, typed invalidation events, and reconnect refetch behavior.
- Blocked by: Task 12.

**Acceptance evidence:**

- Behavior: UI tests prove plaintext API key appears once, revoke/rotate confirmations, delivery outcomes, permission hiding, and secret redaction. Realtime tests prove payloads contain only IDs and trigger query invalidation.
- Integration: Socket.IO server/client test proves workspace room isolation; authoritative browser refetch is Task 15.
- Evidence invalidated by: Event schemas, ticket claims, query keys, permission map, or developer-setting procedures.

- [ ] **Step 1: Write failing secret and invalidation tests**.

```ts
expect(documentProcessingUpdated.parse(event)).toEqual({
	type: "document.processing.updated",
	eventId: "evt_1",
	workspaceId: "ws_1",
	documentId: "doc_1",
	runId: "run_1",
});
expect(JSON.stringify(event)).not.toContain("wordCount");
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test apps/web/src/app/_authenticated/app/developers apps/web/src/app/_authenticated/app/activity apps/web/src/app/_authenticated/app/settings apps/web/src/lib/realtime.test.ts packages/realtime apps/realtime`

Expected: FAIL because product settings routes and document event contracts are absent.

- [ ] **Step 3: Implement settings/activity pages and document invalidation wiring**. Reconnect invalidates active workspace document/run queries; event callbacks never update report data directly.

- [ ] **Step 4: Run web/realtime suites and build**.

Run: `bun test apps/web/src/app/_authenticated apps/web/src/lib/realtime.test.ts packages/realtime apps/realtime && bun --cwd apps/web run build`

Expected: PASS with room-isolation assertions.

- [ ] **Step 5: Commit**.

```bash
git add apps/web packages/realtime apps/realtime
git commit -m "feat: add developer settings and realtime updates"
```

### Task 14: Structured Observability and Operational Runbooks

**Files:**

- Create: `packages/application/src/observability/{fields,redaction,metrics}.ts` and tests
- Modify: logger/runtime files in `apps/api`, `apps/web`, `apps/worker`, `apps/scheduler`, and `apps/realtime`
- Create: `docs/runbooks/{redis-recovery,stuck-processing,webhook-delivery,postgres-recovery,storage-recovery,incident-triage}.md`
- Modify: `.agent/**/*.md`, `AGENTS.md`, `README.md`
- Scope lock: exact for redacted field list and runbook inventory.

**Interfaces:**

- Consumes: Correlation, workspace, document, run, job, and outcome fields from all prior batches.
- Produces: shared safe log context, secret redactor, metrics vocabulary, current architecture guidance, and executable runbooks.
- Blocked by: Task 13.

**Acceptance evidence:**

- Behavior: Redaction tests prove credentials, cookies, API keys, webhook secrets, signed URL queries, raw content, and connection URLs never appear. Documentation tests reject Go/River/Eden/embedded-Elysia claims.
- Integration: Runtime log assertions in Task 15 prove request/correlation IDs cross HTTP, outbox, and worker boundaries.
- Evidence invalidated by: Logger serializers, config fields, event payloads, runtime names, or documentation changes.

- [ ] **Step 1: Write failing redaction and documentation-drift tests**.

```ts
const serialized = JSON.stringify(redact({ authorization: "Bearer secret", databaseUrl: "postgres://secret", documentContent: "private" }));
expect(serialized).not.toContain("secret");
expect(serialized).not.toContain("private");
```

- [ ] **Step 2: Run and verify failures**.

Run: `bun test packages/application/src/observability scripts`

Expected: FAIL because common redaction and new architecture docs are absent.

- [ ] **Step 3: Implement observability wiring and write all six runbooks** with symptoms, impact, diagnosis commands, containment, recovery, verification, and stop conditions using commands that exist after Tasks 1-13.

- [ ] **Step 4: Verify tests, formatting, and architecture guidance**.

Run: `bun test packages/application/src/observability scripts && bun run format:check && bun run check:architecture`

Expected: PASS and no active documentation describes Go/River, browser Eden, or embedded Elysia as current architecture.

- [ ] **Step 5: Commit**.

```bash
git add packages/application apps docs .agent AGENTS.md README.md scripts
git commit -m "docs: add document hub operations guidance"
```

### Task 15: Compose, E2E, Recovery Smoke, and Final Acceptance

**Files:**

- Modify: `docker-compose.yml`, `Dockerfile.*`, `Taskfile.yml`, `.env.example`, `README.md`, `package.json`, `bun.lock`
- Create: `deploy/redis/redis.conf`
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/{auth,document-processing,developer-settings,recovery}.spec.ts`
- Create: `scripts/{compose-smoke,redis-recovery-smoke}.ts` and tests
- Modify: CI workflow files under `.github/workflows/`
- Scope lock: exact for Redis durability, service health dependencies, public ports, and final acceptance commands.

**Interfaces:**

- Consumes: All runtime entrypoints, migrations, health checks, UI routes, API contracts, queue jobs, storage, and realtime events.
- Produces: reproducible complete Compose stack, `task compose:smoke`, Playwright evidence, Redis-loss recovery evidence, and CI gates.
- Blocked by: Task 14 and `GATE-COMPOSE`.

**Acceptance evidence:**

- Behavior: Script tests prove cleanup traps, health polling timeouts, and nonzero exit on skipped or failed probes.
- Integration: Real Compose proves browser and `/v1` lifecycles, MinIO upload/download, worker restart, duplicate suppression, Redis restart/flush reconstruction, webhook byte identity, realtime refetch, cross-workspace denial, and graceful shutdown.
- Evidence invalidated by: Any application/runtime/config/schema/Compose/Dockerfile/E2E change; this is the final full rerun gate.

- [ ] **Step 1: Write failing Compose contract and Playwright journeys**. The document journey uploads this exact fixture:

```md
# Quarterly Notes

Operations remained stable.

## Follow-up

Review the recovery exercise.
```

Assert completed report title `Quarterly Notes`, two headings, deterministic SHA-256, nonzero word/line counts, and downloadable byte-identical JSON.

- [ ] **Step 2: Run static tests and verify failures before stack wiring**.

Run: `bun test scripts/dockerfiles.test.ts scripts/taskfile.test.ts scripts/compose-smoke.test.ts && bunx playwright test --list --config apps/web/playwright.config.ts`

Expected: FAIL because final services, smoke task, and Playwright configuration are absent.

- [ ] **Step 3: Implement final containers, health dependencies, smoke scripts, E2E configuration, and CI**. Only web `4100`, API `4101`, and realtime `4102` are host-published; PostgreSQL, Redis, MinIO, worker health, and scheduler remain internal by default.

- [ ] **Step 4: Run focused static verification**.

Run: `docker compose config && bun test scripts && bun run check:architecture && bun run check-types`

Expected: PASS.

- [ ] **Step 5: Run the complete real-stack acceptance gate**.

Run: `task compose:smoke`

Expected: PASS with every Playwright and recovery scenario executed, followed by container cleanup. `BLOCKED` is recorded if Docker or ports are unavailable; `SKIPPED` is failure.

- [ ] **Step 6: Run repository-wide gates and audit the approved spec**.

Run: `task quality && task build && git diff --check`

Expected: PASS. Record evidence for all ten success criteria from `docs/superpowers/specs/2026-09-16-document-processing-hub-design.md` in the implementation session summary.

- [ ] **Step 7: Commit**.

```bash
git add docker-compose.yml Dockerfile.* Taskfile.yml .env.example README.md package.json bun.lock deploy apps/web/e2e apps/web/playwright.config.ts scripts .github
git commit -m "feat: ship document processing hub"
```
