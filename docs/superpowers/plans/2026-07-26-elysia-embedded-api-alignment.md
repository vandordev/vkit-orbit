# Elysia Embedded API Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the embedded Elysia boundary versioned, singleton-runtime based, and protected by durable architecture guidance.

**Architecture:** Keep `apps/web` as the default public host and its direct `app.fetch` adapter. Refactor `apps/api` into platform plugins plus `/api/v1` route collections; do not create `api-public`, `api-mobile`, or a shared Elysia package yet.

**Tech Stack:** Bun, TypeScript, Elysia, Eden, TypeBox, Zod, TanStack Start, Prisma, Pino.

## Global Constraints

- Public routes use `/api/vN`; `/health` and `/api/internal/*` stay outside that versioning.
- Keep one aggregate `/api/docs` and `/api/openapi.json`.
- Do not add a TypeScript DI container or production `Dependencies` graph.
- Future TypeScript mutation routes call `@repo/application`; they do not import Prisma or mutate data directly.
- Go owns worker usecases under root `internal/`; cross-language implementation duplication is allowed.

## File Structure

```text
apps/api/src/
  runtime.ts
  plugins/{blocked-paths,documentation-auth,request-context,error-envelope}.ts
  schemas/envelope.ts
  routes/create-routes.ts
  routes/v1/{index,system}.ts
  routes/internal/worker-events.ts
  app.ts
scripts/check-architecture.{ts,test.ts}
```

### Task 1: Add version and envelope primitives

**Files:**

- Create: `apps/api/src/schemas/envelope.ts`, `apps/api/src/schemas/envelope.test.ts`
- Create: `apps/api/src/routes/create-routes.ts`, `apps/api/src/routes/create-routes.test.ts`

**Produces:** `successEnvelope(schema)`, `failureEnvelope(code)`, and `createRoutes(version: number)`.

- [ ] **Step 1: Write failing tests**

```ts
test("creates v1 routes", async () => {
  const app = createRoutes(1).get("/probe", () => ({ ok: true }));
  expect((await app.handle(new Request("http://localhost/api/v1/probe"))).status).toBe(200);
});
test("rejects invalid versions", () => {
  expect(() => createRoutes(0)).toThrow("API version must be a positive integer");
  expect(() => createRoutes(1.5)).toThrow("API version must be a positive integer");
});
```

- [ ] **Step 2: Run the test**

Run: `rtk bun test apps/api/src/routes/create-routes.test.ts apps/api/src/schemas/envelope.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the minimum API**

```ts
export function createRoutes(version: number) {
  if (!Number.isSafeInteger(version) || version < 1) {
    throw new Error("API version must be a positive integer");
  }
  return new Elysia({ name: `api-v${version}`, prefix: `/api/v${version}` });
}
```

Implement TypeBox success and failure envelopes. The failure schema contains `success: false`, `error`, `message`, optional `details`, and optional `requestId`.

- [ ] **Step 4: Verify and commit**

Run: `rtk bun test apps/api/src/routes/create-routes.test.ts apps/api/src/schemas/envelope.test.ts && rtk bun --cwd apps/api run check-types`

```bash
git add apps/api/src/schemas apps/api/src/routes/create-routes*
git commit -m "feat(api): add versioned route builder"
```

### Task 2: Serve status through the v1 collection

**Files:**

- Create: `apps/api/src/routes/v1/index.ts`, `apps/api/src/routes/v1/system.ts`, `apps/api/src/routes/v1/system.test.ts`
- Modify: `apps/api/src/routes/index.ts`, `apps/api/src/app.ts`, `apps/api/src/app.test.ts`
- Modify: `apps/web/src/app/api/$.test.ts`, `Taskfile.yml`

**Consumes:** Task 1.

**Produces:** `createV1Routes()` and `GET /api/v1/status`; `/api/status` returns the standard 404 envelope.

- [ ] **Step 1: Make the endpoint tests fail**

```ts
const response = await app.fetch(new Request("http://localhost:4100/api/v1/status"));
expect(response.status).toBe(200);
expect((await app.fetch(new Request("http://localhost:4100/api/status"))).status).toBe(404);
```

Update the web adapter test and `api:status` Taskfile curl to `/api/v1/status`.

- [ ] **Step 2: Run the focused tests**

Run: `rtk bun test apps/api/src/app.test.ts apps/web/src/app/api/$.test.ts`

Expected: FAIL because v1 is not mounted.

- [ ] **Step 3: Implement the collection**

```ts
export const systemRoutes = new Elysia({ name: "v1-system", tags: ["System"] })
  .get("/status", () => ({ success: true as const, data: { status: "ok" as const } }), {
    response: successEnvelope(t.Object({ status: t.Literal("ok") })),
  });
export function createV1Routes() {
  return createRoutes(1).use(systemRoutes);
}
```

Mount only `createV1Routes()` in `app.ts`. Keep the TanStack route `/api/$` unchanged because it already matches the versioned path.

- [ ] **Step 4: Verify and commit**

Run: `rtk bun test apps/api/src/app.test.ts apps/api/src/routes/v1 apps/web/src/app/api/$.test.ts && rtk bun --cwd apps/api run check-types && rtk bun --cwd apps/api run build`

```bash
git add apps/api apps/web/src/app/api/$.test.ts Taskfile.yml
git commit -m "feat(api): version public status route"
```

### Task 3: Replace API production DI with a runtime singleton module

**Files:**

- Create: `apps/api/src/runtime.ts`, `apps/api/src/runtime.test.ts`
- Rename: `apps/api/src/routes/internal-notifications.{ts,test.ts}` to `apps/api/src/routes/internal/worker-events.{ts,test.ts}`
- Modify: `apps/api/src/app.ts`, `apps/api/src/routes/index.ts`

**Produces:** `workerNotificationApiKey` and `publishRealtimeEvent(event)` from one runtime module; no `AppDependencies`, `createApp(dependencies)`, or route dependency object.

- [ ] **Step 1: Write route tests using the module seam**

Mock `../../runtime` before dynamically importing the app. Assert authenticated publish returns 202, absent/wrong key returns 401, malformed event returns 400, and a rejected `publishRealtimeEvent` returns 503 with `REALTIME_UNAVAILABLE`.

- [ ] **Step 2: Run the gateway test**

Run: `rtk bun test apps/api/src/routes/internal/worker-events.test.ts`

Expected: FAIL until the runtime module and renamed route exist.

- [ ] **Step 3: Implement one-time runtime ownership**

```ts
const publisher = env.REALTIME_INTERNAL_URL && env.REALTIME_PUBLISH_API_KEY
  ? createRealtimePublisher({ baseUrl: env.REALTIME_INTERNAL_URL, apiKey: env.REALTIME_PUBLISH_API_KEY })
  : undefined;
export const workerNotificationApiKey = env.WORKER_NOTIFICATION_API_KEY ?? "";
export async function publishRealtimeEvent(event: RealtimeEvent) {
  if (publisher) await publisher(event);
}
```

The internal route imports these exports directly, retains timing-safe key comparison, and preserves all current HTTP statuses.

- [ ] **Step 4: Verify and commit**

Run: `rtk bun test apps/api/src/runtime.test.ts apps/api/src/routes/internal/worker-events.test.ts apps/api/src/app.test.ts && rtk bun --cwd apps/api run check-types`

```bash
git add apps/api/src/runtime* apps/api/src/app.ts apps/api/src/routes
git commit -m "refactor(api): own runtime collaborators once"
```

### Task 4: Extract named Elysia platform plugins and schema the worker gateway

**Files:**

- Create: `apps/api/src/plugins/{blocked-paths,documentation-auth,request-context,error-envelope}.ts`
- Create: `apps/api/src/plugins/plugins.test.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/openapi.{ts,test.ts}`, `apps/api/src/routes/internal/worker-events.ts`

**Consumes:** Tasks 1–3.

**Produces:** a linear composition-only `app.ts`, named plugins, and explicit TypeBox request/response schemas for the internal gateway.

- [ ] **Step 1: Write failing behavior tests**

Assert `/api/.env` and `/api/v1/missing` return 404, Basic-auth-protected docs return the existing challenge, and the worker route OpenAPI metadata has body plus 202/400/401/503 responses. Configure credentials only in the auth test.

- [ ] **Step 2: Run tests**

Run: `rtk bun test apps/api/src/plugins/plugins.test.ts apps/api/src/openapi.test.ts`

Expected: FAIL because the platform modules and gateway schemas do not exist.

- [ ] **Step 3: Implement one named concern per plugin**

Use `new Elysia({ name: "..." })` for blocked-path protection, docs authorization, request-ID/Pino logging, and central error mapping. Preserve every current error envelope/status. Define worker-event TypeBox fields equivalent to the shared Zod contract, keep Zod validation in the publisher as defense in depth, and hide the internal operation from public OpenAPI.

```ts
export const app = new Elysia({ name: "api" })
  .use(blockedPathsPlugin).use(documentationAuthPlugin)
  .use(requestContextPlugin).use(openapiPlugin).use(errorEnvelopePlugin)
  .use(healthRoutes).use(createV1Routes()).use(workerEventRoutes);
```

- [ ] **Step 4: Verify and commit**

Run: `rtk bun test apps/api/src/plugins apps/api/src/openapi.test.ts apps/api/src/routes apps/api/src/app.test.ts && rtk bun --cwd apps/api run lint && rtk bun --cwd apps/api run check-types && rtk bun --cwd apps/api run build`

```bash
git add apps/api/src/plugins apps/api/src/openapi* apps/api/src/routes apps/api/src/app.ts
git commit -m "refactor(api): compose Elysia platform plugins"
```

### Task 5: Add guidance and enforceable architecture guards

**Files:**

- Create: `.agent/backend-typescript.md`, `scripts/check-architecture.ts`, `scripts/check-architecture.test.ts`
- Modify: `.agent/{api/README.md,architecture.md,scheduler/README.md,realtime/README.md,worker/README.md}`
- Modify: `README.md`, `AGENTS.md`, `package.json`, `Taskfile.yml`

- [ ] **Step 1: Write failing fixture tests**

Use temporary fixtures to make the checker reject: a `routes/v1` file importing `@repo/database`; a v1 route containing `.create(`; an `app.ts` importing `@repo/application`; and web code importing `@repo/application`. Include a passing fixture containing only plugin and route-collection imports.

- [ ] **Step 2: Run the test**

Run: `rtk bun test scripts/check-architecture.test.ts`

Expected: FAIL because the checker does not exist.

- [ ] **Step 3: Implement guard and guidance**

Add root `check:architecture` running the script; run it from `task quality`. Scan non-test source files for the listed forbidden imports/write tokens. Document version collections, one aggregate OpenAPI, singleton-per-process, no TypeScript DI graph, command mutation/read adapter rules, and root-`internal/` Go ownership with allowed equivalent usecases. Update README/Taskfile API examples to `/api/v1/status`.

- [ ] **Step 4: Verify and commit**

Run: `rtk bun test scripts/check-architecture.test.ts && rtk bun run check:architecture && rtk rg -n "/api/status|must not duplicate TypeScript usecases" README.md Taskfile.yml .agent AGENTS.md`

```bash
git add .agent README.md AGENTS.md Taskfile.yml package.json scripts
git commit -m "docs: enforce backend API boundaries"
```

### Task 6: Verify the complete embedded API change

- [ ] **Step 1: Run focused and repository verification**

Run: `rtk bun test apps/api apps/web/src/app/api scripts/check-architecture.test.ts && rtk bun run check:architecture && rtk task quality && rtk task build`

Expected: PASS.

- [ ] **Step 2: Run the Compose smoke test**

Run: `rtk task compose:up:detached && rtk docker compose ps && rtk curl --fail http://localhost:4100/health && rtk curl --fail http://localhost:4100/api/v1/status && rtk docker compose down`

Expected: migration completes; web is healthy; versioned status returns 200; Compose is stopped afterwards.

- [ ] **Step 3: Check handoff state**

Run: `rtk git status --short && rtk git diff --check`

Expected: no whitespace errors and no uncommitted changes.

## Plan Self-Review

- Tasks 1–2 cover versioning, public status migration, Eden adapter, and task command.
- Tasks 3–4 cover singleton runtime ownership, Elysia plugins, schemas, OpenAPI, and internal gateway preservation.
- Task 5 adds the promised durable guidance and architecture guard, including the Go-worker correction.
- Task 6 supplies focused, quality/build, and Compose evidence.
- No task introduces a second HTTP server or premature shared HTTP package.
