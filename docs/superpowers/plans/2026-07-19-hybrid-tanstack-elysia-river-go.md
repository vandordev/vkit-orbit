# Hybrid TanStack Start, Elysia, River Go Implementation Plan

> **For agentic workers:** Execute this plan inline with `superpowers:executing-plans`; do not create a worktree or dispatch subagents for this repository. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the vkit-rapid boilerplate into a TanStack Start application with embedded Elysia, Bun/River job producers, a Go/River worker, Socket.IO notifications relayed by Elysia, and a one-shot migration runtime.

**Architecture:** `apps/web` is the only public server and mounts the Elysia app through a TanStack Start `/api/$` server route. Elysia and the Bun scheduler enqueue typed River jobs into PostgreSQL; a Go/River worker consumes Go-specific work and POSTs completed-event envelopes to Elysia, which validates and forwards them to the isolated Socket.IO runtime. The migration runtime first executes Prisma deploy migrations and then applies River migrations.

**Tech Stack:** Bun 1.3.14, TanStack Start, Vite/Nitro, React 19, Tailwind CSS 4, shadcn/ui primitives, Elysia/Eden, Prisma/PostgreSQL, River TypeScript drivers, Go 1.25.7, pgx, River Go, Socket.IO, Docker Compose, Task.

**Status:** Implemented on `main`. All task steps are complete; focused tests,
`task quality`, `task build`, and Compose smoke checks passed. See the
repository README and AGENTS.md for the current operational source of truth.

---

## Target file structure

- `apps/web/src/routes/{api.$,health}.ts` own TanStack Start's thin Elysia route adapters and Eden's isomorphic client.
- `apps/web/src/{router.tsx,server.ts,styles.css,components/**,routes/**}` replace Next.js routing and Mantine with TanStack Start and shadcn/Tailwind.
- `apps/api/src/app.ts` remains the transport-neutral Elysia factory; `src/routes/internal-notifications.ts` accepts authenticated worker completion notifications; `src/lib/realtime-publisher.ts` forwards validated events to Socket.IO.
- `packages/queue/src/{river.ts,example-realtime-notification.ts,index.ts}` defines validated, versioned River job contracts and the TypeScript producer used by Elysia and the scheduler.
- `contracts/jobs/README.md` documents cross-language `kind`/JSON versioning rules.
- `packages/queue/src/example-realtime-notification.ts`, `apps/api/src/routes/examples.ts`, `apps/scheduler/src/schedules.ts`, `internal/worker/example_realtime_notification.go`, and `apps/web/src/routes/examples/realtime.tsx` contain the one opt-in worked example; it is the only baseline job contract.
- `go.mod`, `internal/{river,notify}/**`, and `apps/{worker,migrate}/main.go` own Go/River consumption, internal Elysia notification, and Prisma-plus-River migration orchestration.
- `apps/scheduler/src/**` remains Bun-only and enqueues River contracts; it never imports Prisma or application usecases.
- `packages/realtime/src/**` and `apps/realtime/src/**` retain Socket.IO, but Elysia becomes its sole upstream publisher.
- `config/*.yaml`, `packages/config/src/**`, `.env.example`, `Taskfile.yml`, `turbo.json`, Dockerfiles, `docker-compose.yml`, `README.md`, and `.agent/*.md` describe and operate the new topology, including the browser-visible `VITE_REALTIME_URL` and Socket.IO CORS origin.

### Task 1: Establish the mixed-runtime toolchain and command surface

**Files:**
- Create: `go.mod`, `dev/air/worker.toml`, `apps/migrate/main.go`, `apps/migrate/main_test.go`
- Modify: `package.json`, `Taskfile.yml`, `turbo.json`, `.gitignore`, `.env.example`
- Test: `apps/migrate/main_test.go`

- [x] **Step 1: Write the failing migration-orchestration test.**

```go
func TestRunAppliesPrismaBeforeRiver(t *testing.T) {
    var calls []string
    err := run(context.Background(), "postgresql://example", func(_ context.Context, name string, args ...string) error {
        calls = append(calls, name+" "+strings.Join(args, " "))
        return nil
    }, func(context.Context, string) error {
        calls = append(calls, "river up")
        return nil
    })
    if err != nil { t.Fatal(err) }
    if diff := cmp.Diff([]string{"bun --cwd packages/database run db:migrate", "river up"}, calls); diff != "" { t.Fatal(diff) }
}
```

- [x] **Step 2: Run the test to verify it fails.**

Run: `rtk go test ./apps/migrate -run TestRunAppliesPrismaBeforeRiver -count=1`

Expected: FAIL because the Go module and `run` function do not exist.

- [x] **Step 3: Add the root Go module and minimal migration command.**

Create `go.mod` with the fixed module identity and dependencies:

```go
module github.com/vandordev/vkit-orbit

go 1.25.7

require (
    github.com/google/go-cmp v0.7.0
    github.com/jackc/pgx/v5 v5.10.0
    github.com/riverqueue/river v0.40.0
    github.com/riverqueue/river/riverdriver/riverdatabasesql v0.40.0
)

tool github.com/air-verse/air
```

Implement `apps/migrate/main.go` so `run` first invokes exactly
`bun --cwd packages/database run db:migrate`, then opens a `database/sql` pool
with the pgx stdlib driver, constructs
`rivermigrate.New(riverdatabasesql.New(database), nil)`, and calls
`Migrate(ctx, rivermigrate.DirectionUp, nil)`. `main` creates a signal-aware
context, reads `DATABASE_URL`, calls `run`, and exits non-zero on error. Keep
the command runner and River migrator function parameters injectable as in the
test.

- [x] **Step 4: Replace root scripts and Task commands.**

Update root `package.json` to pin `bun@1.3.14`, remove Next/standalone-API
scripts, and retain only TypeScript runtime commands: `dev:web`, `dev:scheduler`,
`dev:realtime`, matching start/build/lint/typecheck commands. Add `go` commands
and the cross-runtime aggregate commands to `Taskfile.yml`:

```yaml
install:
  cmds: [rtk bun install --ignore-scripts, rtk go mod download]
migrate:
  cmds: [rtk go run ./apps/migrate]
dev:worker:
  cmds: [rtk go tool air -c dev/air/worker.toml]
test:go:
  cmds: [rtk go test ./... -count=1]
build:go:
  cmds: [rtk go build ./apps/worker ./apps/migrate]
doctor:
  cmds:
    - test -f .env || { echo "missing .env; run: cp .env.example .env" >&2; exit 1; }
    - for tool in go bun task docker; do command -v "$tool" >/dev/null || { echo "missing required tool: $tool" >&2; exit 1; }; done
    - rtk go test ./apps/migrate -run TestRunAppliesPrismaBeforeRiver -count=1
test:
  cmds: [rtk bun test apps/api apps/web apps/scheduler apps/realtime packages, rtk go test ./... -count=1]
quality:
  cmds: [rtk task test, rtk bun run lint, rtk bun run check-types, rtk go vet ./...]
build:
  cmds: [rtk bun run build, rtk task build:go]
```

Implement `task dev` so `task dev` runs `dev:web`, `dev:worker`, and
`dev:scheduler` in parallel; optional arguments after `--` are limited to
`web`, `worker`, `scheduler`, and `realtime` and are validated before dispatch.
`task start` starts only web; `task start:jobs` starts Go worker plus Bun
scheduler in parallel. Do not leave the old Bun worker command in the Taskfile.

Set Turbo web build outputs to `.output/**` and `.vite/**`, remove Next-specific
environment/output entries, and add `go.sum`, `.air/`, `.output/`, `.vite/`, and
`apps/web/src/routeTree.gen.ts` to the appropriate generated-file rules.

- [x] **Step 5: Run focused verification.**

Run: `rtk go mod tidy && rtk go test ./apps/migrate -count=1 && rtk task --list`

Expected: migration test passes and `migrate`, `dev:worker`, `test:go`, and
`build:go` appear in the command list.

- [x] **Step 6: Commit the toolchain baseline.**

```bash
rtk git add go.mod go.sum apps/migrate dev/air/worker.toml package.json Taskfile.yml turbo.json .gitignore .env.example
rtk git commit -m "build: add go river toolchain"
```

### Task 2: Replace Next.js/Mantine with TanStack Start and shadcn/Tailwind

**Files:**
- Delete: `apps/web/app/**`, `apps/web/components/query-provider.tsx`, `apps/web/next.config.mjs`, `apps/web/next.config.test.ts`, `apps/web/postcss.config.mjs`
- Create: `apps/web/vite.config.ts`, `apps/web/src/router.tsx`, `apps/web/src/server.ts`, `apps/web/src/styles.css`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/index.tsx`, `apps/web/src/components/query-provider.tsx`, `apps/web/src/components/ui/button.tsx`, `apps/web/src/lib/utils.ts`, `apps/web/components.json`
- Modify: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/eslint.config.js`
- Test: `apps/web/vite.config.test.ts`, `apps/web/src/routes/__root.test.tsx`

- [x] **Step 1: Write failing configuration and root-route tests.**

```ts
test("uses TanStack Start with Bun Nitro output", async () => {
  const source = await Bun.file(new URL("./vite.config.ts", import.meta.url)).text();
  expect(source).toContain("tanstackStart");
  expect(source).toContain('nitro({ preset: "bun" })');
});

test("uses QueryProvider and does not retain Mantine", async () => {
  const source = await Bun.file(new URL("./__root.tsx", import.meta.url)).text();
  expect(source).toContain("QueryProvider");
  expect(source).not.toContain("MantineProvider");
});
```

- [x] **Step 2: Run the tests to verify they fail.**

Run: `rtk bun test apps/web/vite.config.test.ts apps/web/src/routes/__root.test.tsx`

Expected: FAIL because Vite/TanStack route files are absent.

- [x] **Step 3: Install and configure the TanStack Start web runtime.**

Replace `apps/web/package.json` dependencies with TanStack Start/router/query,
Vite, Nitro, `@tailwindcss/vite`, Tailwind, `class-variance-authority`, `clsx`,
`tailwind-merge`, Radix Slot, React, Elysia/Eden, and `@repo/api`; remove Next,
Mantine, and `@t3-oss/env-nextjs`. Use these scripts:

```json
{
  "dev": "bun --env-file=../../.env run ../../packages/config/src/run.ts --modules base,web,api,storage -- bun run vite --port 4100",
  "build": "NODE_ENV=production bun --env-file=../../.env run ../../packages/config/src/run.ts --modules base,web,api,storage -- bun run vite build",
  "start": "bun --env-file=../../.env run ../../packages/config/src/run.ts --modules base,web,api,storage -- bun .output/server/index.mjs"
}
```

Configure `vite.config.ts` with `tailwindcss()`, `tanstackRouter`,
`tanstackStart`, `nitro({ preset: "bun" })`, and React. Do not configure a
network API proxy. Create `router.tsx` using `createRouter({ routeTree,
defaultPreload: "intent", scrollRestoration: true })`; create `server.ts` with
`createServerEntry({ fetch: (request) => handler.fetch(request) })`.

Create `styles.css` with `@import "tailwindcss"`, semantic CSS variables, and
base focus/body styles. Add the reusable `cn` helper and the Radix Slot/CVA
Button primitive copied from the Tango baseline. Root and index routes must use
`QueryProvider`, `HeadContent`, `Scripts`, and an accessible public boilerplate
landing page.

- [x] **Step 4: Make the tests pass and generate routes.**

Run: `rtk bun install && rtk bun test apps/web/vite.config.test.ts apps/web/src/routes/__root.test.tsx && rtk bun run --cwd apps/web check-types`

Expected: tests pass and `src/routeTree.gen.ts` is generated by the router
plugin/typecheck without an unstaged diff after it is added to Git.

- [x] **Step 5: Commit the web conversion.**

```bash
rtk git add apps/web package.json bun.lock
rtk git commit -m "feat(web): adopt tanstack start and shadcn baseline"
```

### Task 3: Embed Elysia in the TanStack Start API route and preserve Eden types

**Files:**
- Delete: `apps/web/lib/env.ts`, `apps/web/lib/api/client.ts`, `apps/web/lib/api/client.test.ts`, `apps/web/lib/api/server.ts`
- Create: `apps/web/src/routes/api.$.ts`, `apps/web/src/routes/api.$.test.ts`, `apps/web/src/routes/health.ts`, `apps/web/src/routes/health.test.ts`, `apps/web/src/lib/api.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/app.test.ts`, `apps/api/package.json`, `apps/web/tsconfig.json`, `.agent/{architecture,api,web,config}.md`

- [x] **Step 1: Write the failing route-adapter test.**

```ts
test("delegates every supported method to Elysia", async () => {
  const route = await import("./api.$");
  const response = await route.Route.options.server.handlers.GET({
    request: new Request("http://localhost:4100/api/status"),
  } as never);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ success: true, data: { status: "ok" } });
});

test("serves Elysia health through the TanStack Start health route", async () => {
  const route = await import("./health");
  const response = await route.Route.options.server.handlers.GET({
    request: new Request("http://localhost:4100/health"),
  } as never);
  expect(response.status).toBe(200);
});
```

- [x] **Step 2: Run the test to verify it fails.**

Run: `rtk bun test apps/web/src/routes/api.$.test.ts`

Expected: FAIL because `api.$.ts` does not exist.

- [x] **Step 3: Add the embedded handler and isomorphic Eden factory.**

Create `apps/web/src/routes/api.$.ts` with `createFileRoute("/api/$")`, import
`app`/`App` from `@repo/api`, and expose GET, POST, PUT, PATCH, DELETE, OPTIONS,
and HEAD in `server.handlers`. Each handler is exactly:

```ts
const handle = ({ request }: { request: Request }) => app.fetch(request);
```

In the same module, export `getTreaty = createIsomorphicFn().server(() =>
treaty(app).api).client(() => treaty<App>(window.location.origin).api)`. Put
React Query query-key helpers only in `src/lib/api.ts`; components must not use
ad-hoc `fetch`.

Create `apps/web/src/routes/health.ts` with `createFileRoute("/health")` and a
GET server handler that delegates the original request to `app.fetch`. This is
the only non-`/api` mount of Elysia and preserves the process-health endpoint in
the embedded deployment.

Remove CORS from the embedded default app configuration because browser traffic
is same-origin. Keep `apps/api/src/server.ts` only as an explicitly optional
standalone entrypoint, never called by `task dev`/Compose. Update API tests to
call `app.fetch` rather than `app.handle`, use `http://localhost:4100` URLs, and
assert the existing `/api` response envelope remains unchanged. Update agent
documents to replace Next.js terminology with TanStack Start and the route file
above.

- [x] **Step 4: Run focused API and web verification.**

Run: `rtk bun test apps/api/src/app.test.ts apps/web/src/routes/api.$.test.ts && rtk bun run --cwd apps/web check-types`

Expected: tests pass; a server-side Eden call avoids network I/O and a browser
Eden call targets the same-origin `/api` handler.

- [x] **Step 5: Commit embedded Elysia.**

```bash
rtk git add apps/api apps/web .agent
rtk git commit -m "feat(api): embed elysia in tanstack start"
```

### Task 4: Replace pg-boss with typed River producers and versioned contracts

**Files:**
- Delete: `packages/queue/src/client.ts`, `packages/queue/src/jobs.ts`, `packages/queue/src/{client,jobs}.test.ts`
- Create: `packages/queue/src/contracts.ts`, `packages/queue/src/river.ts`, `packages/queue/src/river.test.ts`, `contracts/jobs/README.md`
- Modify: `packages/queue/src/index.ts`, `packages/queue/package.json`, `apps/scheduler/src/{main,schedules,schedules.test}.ts`, `apps/scheduler/package.json`

- [x] **Step 1: Write the failing producer tests.**

```ts
const contract = defineJob("example.v1", z.object({ resourceId: z.string().uuid() }));

test("rejects invalid payload before it reaches River", async () => {
  await expect(enqueue(client, contract, { resourceId: "bad" })).rejects.toThrow();
});

test("uses the stable kind and validated JSON payload", async () => {
  await enqueue(client, contract, { resourceId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12" });
  expect(inserted).toMatchObject({ kind: "example.v1", args: { resourceId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12" } });
});

test("forwards the Prisma transaction to River insert", async () => {
  await enqueueInTransaction(transaction, client, contract, validPayload);
  expect(insertOptions).toMatchObject({ tx: transaction });
});
```

- [x] **Step 2: Run the test to verify it fails.**

Run: `rtk bun test packages/queue/src/river.test.ts`

Expected: FAIL because `defineJob` and `enqueue` do not exist.

- [x] **Step 3: Implement the River TypeScript-only producer boundary.**

Install `riverqueue`, `@riverqueue/driver-prisma`, and use `@repo/database`
Prisma. Implement `defineJob(kind, schema)` to reject blank/whitespace kinds and
`enqueue(client, contract, payload, options)` to call `schema.parse(payload)`
before `client.insert(new JobArgsObject(contract.kind, parsed), options)`.
Export a `createRiverClient(prisma)` using `new PrismaDriver(prisma)`, plus an
`enqueueInTransaction(tx, ...)` variant that passes `{ tx }` into River insert.
At this stage, keep the queue boundary free of product contract instances; Task
5 adds the sole opt-in worked-example contract.

Update scheduler to construct only the River producer and register no product
schedules. Its test must assert no `insert` occurs; remove all pg-boss lifecycle
calls (`start`, `stop`, `work`, `schedule`). Write `contracts/jobs/README.md`
with these invariants: stable `kind`, JSON-only payload, Zod producer validation,
matching Go struct decoder, and a new `.vN` kind for breaking changes.

- [x] **Step 4: Run focused River producer verification.**

Run: `rtk bun test packages/queue apps/scheduler && rtk bun run --cwd packages/queue check-types && rtk bun run --cwd apps/scheduler check-types`

Expected: all tests pass and `rg "pg-boss" package.json apps packages` returns
no source/dependency match.

- [x] **Step 5: Commit the queue conversion.**

```bash
rtk git add packages/queue apps/scheduler contracts/jobs package.json bun.lock
rtk git commit -m "feat(queue): enqueue river jobs from typescript"
```

### Task 5: Add the opt-in end-to-end realtime-notification example

**Files:**
- Create: `packages/queue/src/example-realtime-notification.ts`, `packages/queue/src/example-realtime-notification.test.ts`, `apps/api/src/routes/examples.ts`, `apps/api/src/routes/examples.test.ts`
- Modify: `packages/queue/src/index.ts`, `apps/scheduler/src/{main,schedules,schedules.test}.ts`, `apps/api/src/app.ts`, `config/scheduler.yaml`, `packages/config/src/scheduler.ts`, `.env.example`, `README.md`

- [x] **Step 1: Write failing tests for every example boundary.**

```ts
test("enqueues the example job from Elysia", async () => {
  const enqueue = mock(async () => ({ job: { id: 42 } }));
  const app = createApp({ enqueueExample: enqueue, ...testDependencies });
  const response = await app.fetch(new Request("http://localhost:4100/api/examples/realtime-notifications", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ resourceId: "r1", workspaceId: "w1" }),
  }));
  expect(response.status).toBe(202);
  expect(enqueue).toHaveBeenCalledWith({ resourceId: "r1", workspaceId: "w1" });
});

test("does not register the example schedule unless enabled", async () => {
  const enqueue = mock(async () => undefined);
  const stop = registerSchedules({ enqueue }, { ENABLE_EXAMPLE_SCHEDULE: false });
  await Bun.sleep(0);
  expect(enqueue).not.toHaveBeenCalled();
  stop();
});
```

- [x] **Step 2: Run the example tests to verify they fail.**

Run: `rtk bun test packages/queue/src/example-realtime-notification.test.ts apps/api/src/routes/examples.test.ts apps/scheduler/src/schedules.test.ts`

Expected: FAIL because the opt-in contract, route, and schedule do not exist.

- [x] **Step 3: Implement the named contract, manual API endpoint, and disabled-by-default scheduler.**

In `packages/queue/src/example-realtime-notification.ts`, export exactly:

```ts
export const exampleRealtimeNotificationJob = defineJob(
  "example.realtime-notification.v1",
  z.object({ resourceId: z.string().min(1), workspaceId: z.string().min(1) }),
);
```

Add `POST /api/examples/realtime-notifications` to Elysia. It validates the same
payload, calls the injected River producer, and returns HTTP 202 with
`{ success: true, data: { jobId } }`. In this task, refactor `app.ts` to export
`createApp({ enqueueExample = enqueueExampleRealtimeNotification })` while
retaining `app = createApp({})` for production. This route has no Prisma write
and is the only manual trigger for the example.

Add `ENABLE_EXAMPLE_SCHEDULE: ${ENABLE_EXAMPLE_SCHEDULE:-false}` and
`EXAMPLE_SCHEDULE_INTERVAL_MS: ${EXAMPLE_SCHEDULE_INTERVAL_MS:-300000}` to
`config/scheduler.yaml`; parse both in scheduler config. When enabled,
`registerSchedules` uses `setInterval` to enqueue the contract with stable
`resourceId: "example-resource"` and `workspaceId: "example-workspace"`, calls
the same enqueue once at startup, and returns a cleanup function. When disabled,
it registers neither timer nor job. The scheduler main process calls that cleanup
on SIGINT/SIGTERM.

- [x] **Step 4: Verify enabled scheduling and commit the producer-side example.**

Extend the schedule test with `ENABLE_EXAMPLE_SCHEDULE: true`, a fake timer, and
an assertion that startup invokes `enqueue(exampleRealtimeNotificationJob,
{ resourceId: "example-resource", workspaceId: "example-workspace" })` exactly
once. Then run:

Run: `rtk bun test packages/queue apps/api apps/scheduler`

Expected: manual enqueue and both disabled/enabled schedule behavior pass without
a Prisma model.

- [x] **Step 5: Commit the producer-side example.**

```bash
rtk git add packages/queue apps/api apps/scheduler config/scheduler.yaml packages/config/src/scheduler.ts .env.example README.md
rtk git commit -m "feat: add opt-in realtime job producer example"
```

### Task 6: Add Go/River worker and authenticated Elysia notification client

**Files:**
- Create: `internal/river/client.go`, `internal/river/client_test.go`, `internal/notify/client.go`, `internal/notify/client_test.go`, `internal/worker/example_realtime_notification.go`, `internal/worker/example_realtime_notification_test.go`, `apps/worker/main.go`, `apps/worker/main_test.go`, `dev/air/worker.toml`
- Delete: `apps/worker/src/**`, `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/eslint.config.js`
- Modify: `.env.example`, `config/worker.yaml`, `README.md`, `.agent/worker.md`

- [x] **Step 1: Write failing Go tests for worker lifecycle and notification.**

```go
type notifyFunc func(context.Context, notify.Event) error

func (fn notifyFunc) Notify(ctx context.Context, event notify.Event) error {
    return fn(ctx, event)
}

func TestNotifierPostsCompletionToElysia(t *testing.T) {
    request := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if got := r.Header.Get("X-Worker-Notification-Key"); got != "worker-key" { t.Fatalf("key = %q", got) }
        if r.URL.Path != "/api/internal/worker-events" { t.Fatalf("path = %s", r.URL.Path) }
        w.WriteHeader(http.StatusAccepted)
    }))
    defer request.Close()
    err := NewNotifier(request.URL, "worker-key", request.Client()).Notify(context.Background(), Event{Type: "resource.updated", EventID: "event-1", OccurredAt: time.Now().UTC().Format(time.RFC3339Nano), ResourceID: "r1", WorkspaceID: "w1"})
    if err != nil { t.Fatal(err) }
}

func TestNotifierReturnsErrorForRetryableGatewayFailure(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusServiceUnavailable) }))
    defer server.Close()
    err := NewNotifier(server.URL, "worker-key", server.Client()).Notify(context.Background(), validEvent())
    if err == nil { t.Fatal("Notify() error = nil") }
}

func TestExampleRealtimeNotificationWorkerNotifiesElysiaAfterSuccess(t *testing.T) {
    var got notify.Event
    job := &worker.ExampleRealtimeNotificationWorker{Notifier: notifyFunc(func(_ context.Context, event notify.Event) error { got = event; return nil })}
    err := job.Work(context.Background(), &river.Job[worker.ExampleRealtimeNotificationArgs]{Args: worker.ExampleRealtimeNotificationArgs{ResourceID: "r1", WorkspaceID: "w1"}})
    if err != nil { t.Fatal(err) }
    if got.ResourceID != "r1" || got.WorkspaceID != "w1" || got.Type != "resource.updated" { t.Fatalf("event = %#v", got) }
}
```

- [x] **Step 2: Run the failing Go tests.**

Run: `rtk go test ./internal/notify ./internal/worker ./apps/worker -count=1`

Expected: FAIL because worker packages are absent.

- [x] **Step 3: Implement the worker without product handlers.**

Implement `internal/river.NewWorkerClient` with a `database/sql` pool backed by
the pgx stdlib driver, `riverdatabasesql.New(database)`, `river.NewWorkers()`, a
`default` queue, and a caller-provided worker
registration function. `apps/worker/main.go` must load `DATABASE_URL`,
`WORKER_NOTIFICATION_URL`, and `WORKER_NOTIFICATION_API_KEY`; establish a
signal-aware context; start the River client; wait for cancellation; and stop
the client/pool gracefully.

Implement `internal/notify.Event` using JSON fields `type`, `eventId`,
`occurredAt`, `resourceId`, and `workspaceId`. `Notifier.Notify` POSTs it to
`/api/internal/worker-events` with `content-type: application/json` and
`x-worker-notification-key`; it returns an error for every non-202 response.

Implement and register exactly one opt-in demonstration handler:
`ExampleRealtimeNotificationArgs.Kind()` returns
`"example.realtime-notification.v1"`. Its River worker embeds
`river.WorkerDefaults[ExampleRealtimeNotificationArgs]`; `Work` validates both
IDs, builds a UUID event ID and RFC3339Nano timestamp, then calls
`Notifier.Notify`. Return the notification error unchanged so River retries a
failed Elysia relay. Do not add a database write or other generic product worker.

- [x] **Step 4: Make tests pass and format Go.**

Run: `rtk gofmt -w internal apps/worker && rtk go test ./internal/notify ./internal/river ./internal/worker ./apps/worker -count=1`

Expected: all Go tests pass; no worker contains TypeScript usecase imports or
Socket.IO connection code.

- [x] **Step 5: Commit the Go worker.**

```bash
rtk git add go.mod go.sum internal apps/worker dev/air/worker.toml .env.example config/worker.yaml README.md .agent/worker.md
rtk git commit -m "feat(worker): add go river runtime"
```

### Task 7: Make Elysia the authenticated realtime gateway

**Files:**
- Create: `apps/api/src/lib/realtime-publisher.ts`, `apps/api/src/lib/realtime-publisher.test.ts`, `apps/api/src/routes/internal-notifications.ts`, `apps/api/src/routes/internal-notifications.test.ts`
- Modify: `apps/api/src/app.ts`, `apps/api/src/lib/env.ts`, `packages/config/src/api.ts`, `config/api.yaml`, `.env.example`, `packages/realtime/src/events.ts`, `packages/realtime/src/publisher.ts`

- [x] **Step 1: Write failing API gateway tests.**

```ts
test("accepts an authenticated worker event and forwards it once", async () => {
  const publish = mock(async () => undefined);
  const app = createApp({ workerNotificationApiKey: "worker-key", publish });
  const response = await app.fetch(new Request("http://localhost:4100/api/internal/worker-events", {
    method: "POST",
    headers: { "content-type": "application/json", "x-worker-notification-key": "worker-key" },
    body: JSON.stringify(validEvent),
  }));
  expect(response.status).toBe(202);
  expect(publish).toHaveBeenCalledWith(validEvent);
});

test("rejects an invalid or unauthenticated worker event", async () => {
  expect((await app.fetch(new Request("http://localhost:4100/api/internal/worker-events", { method: "POST" }))).status).toBe(401);
});

test("returns retryable failure when the realtime publisher is unavailable", async () => {
  const app = createApp({ workerNotificationApiKey: "worker-key", publish: async () => { throw new Error("unavailable"); } });
  const response = await app.fetch(authenticatedWorkerEventRequest(validEvent));
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ success: false, error: "REALTIME_UNAVAILABLE" });
});
```

- [x] **Step 2: Run the tests to verify they fail.**

Run: `rtk bun test apps/api/src/routes/internal-notifications.test.ts`

Expected: FAIL because the internal endpoint and injectable app factory do not
exist.

- [x] **Step 3: Add the Elysia worker-notification route and publisher.**

Extend the existing `createApp` dependency object with `workerNotificationApiKey`
and `publish`, and retain `app = createApp({})` as the production factory result.
Add `POST /api/internal/worker-events`; it compares
`x-worker-notification-key` in constant time, parses the shared
`realtimeEventSchema`, calls `dependencies.publish(event)`, and returns exactly
`{ success: true, data: { accepted: true } }` with HTTP 202. Authentication
failure returns the standard 401 failure envelope; schema failure returns the
standard 400 validation envelope.

`createRealtimePublisher` remains the only Elysia-to-Socket.IO transport. It
POSTs to `${REALTIME_INTERNAL_URL}/internal/events` using
`x-realtime-api-key`; Elysia never imports Socket.IO. Add optional-but-paired API
configuration for `WORKER_NOTIFICATION_API_KEY`, `REALTIME_INTERNAL_URL`, and
`REALTIME_PUBLISH_API_KEY`; reject a partial realtime configuration at startup.
When that publisher rejects a worker notification, map the error to the standard
503 `{ success: false, error: "REALTIME_UNAVAILABLE", ... }` envelope so the Go
handler returns an error and River retries the completion notification.

- [x] **Step 4: Run focused gateway verification.**

Run: `rtk bun test apps/api packages/realtime && rtk bun run --cwd apps/api check-types`

Expected: a valid worker completion reaches the injected publisher; wrong key,
malformed JSON, malformed event, and rejected realtime publisher all have
deterministic API responses/logging.

- [x] **Step 5: Commit the Elysia realtime gateway.**

```bash
rtk git add apps/api packages/config packages/realtime config/api.yaml .env.example
rtk git commit -m "feat(realtime): relay worker events through elysia"
```

### Task 8: Harden the Socket.IO consumer contract and browser refetch hook

**Files:**
- Create: `apps/web/src/lib/realtime.ts`, `apps/web/src/lib/realtime.test.ts`, `apps/web/src/routes/examples/realtime.tsx`, `apps/web/src/routes/examples/realtime.test.tsx`
- Modify: `apps/realtime/src/server.ts`, `apps/realtime/src/server.test.ts`, `apps/realtime/src/main.ts`, `apps/realtime/package.json`, `apps/web/package.json`, `apps/web/tsconfig.json`, `packages/realtime/src/events.ts`, `config/{web,realtime}.yaml`, `packages/config/src/realtime.ts`, `.env.example`, `README.md`

- [x] **Step 1: Write failing end-to-end relay and refetch tests.**

```ts
test("emits a validated event only to an authorized workspace room", async () => {
  const runtime = createRuntime(async () => true);
  const event = once(client, "realtime-event");
  await fetch(`${baseUrl}/internal/events`, { method: "POST", headers: publisherHeaders, body: JSON.stringify(validEvent) });
  expect(await event).toEqual([validEvent]);
});

test("invalidates queries after event and reconnect", () => {
  const invalidate = mock(() => Promise.resolve());
  bindRealtimeInvalidation(socket, queryClient);
  socket.emit("realtime-event", validEvent);
  socket.emit("connect");
  expect(invalidate).toHaveBeenCalledTimes(2);
});

test("uses the configured public realtime origin", () => {
  expect(createRealtimeSocket("ticket").io.uri).toBe(import.meta.env.VITE_REALTIME_URL);
});

test("cleans up the example socket when its walkthrough unmounts", async () => {
  const socket = createFakeSocket();
  const view = render(<RealtimeExamplePage createSocket={() => socket} />);
  await userEvent.click(view.getByRole("button", { name: "Connect" }));
  view.unmount();
  expect(socket.close).toHaveBeenCalledOnce();
});
```

- [x] **Step 2: Run the tests to verify they fail.**

Run: `rtk bun test apps/realtime/src/server.test.ts apps/web/src/lib/realtime.test.ts`

Expected: the browser hook does not exist and the server has no authorized
delivery assertion.

- [x] **Step 3: Implement signal-only Socket.IO consumption.**

Keep `POST /internal/events` private to the Elysia publisher API key. Parse the
same event schema, derive rooms through `roomsForEvent`, and emit
`realtime-event` only after ticket and room authorization. In web,
`bindRealtimeInvalidation(socket, queryClient)` subscribes to both
`realtime-event` and `connect`, calls `queryClient.invalidateQueries()`, and
returns an unsubscribe function that removes both listeners. It must not store
event payload as React Query data.

Set `VITE_REALTIME_URL` in `config/web.yaml` and `.env.example`, expose it only
through Vite's `import.meta.env`, and type it in `apps/web/tsconfig.json` with
`vite/client`. `createRealtimeSocket(ticket)` uses that exact URL with
`path: "/ws"`, `auth: { ticket }`, and `transports: ["websocket"]`. Configure
the Socket.IO server with both `cors: { origin: config.REALTIME_CORS_ORIGIN,
credentials: true }` and `allowRequest: (request, callback) => callback(null,
request.headers.origin === config.REALTIME_CORS_ORIGIN)`. Add
`REALTIME_CORS_ORIGIN` to the realtime config/YAML and test that a disallowed
browser Origin is rejected during the Socket.IO handshake. `allowRequest` is
required because CORS headers alone do not restrict WebSocket upgrades. The
generic baseline still has no ticket-issuing auth endpoint; a
product supplies the ticket before calling `createRealtimeSocket`.

Create `/examples/realtime` with an accessible form for a product-issued ticket
and resource/workspace IDs. On connect it calls `createRealtimeSocket`, joins the
supplied workspace, and binds `bindRealtimeInvalidation`; its manual trigger
calls the typed `POST /api/examples/realtime-notifications` Eden endpoint. The
page states that it is opt-in, has no default navigation link, does not mint a
ticket, and returns the socket cleanup function during unmount.

- [x] **Step 4: Run focused realtime verification.**

Run: `rtk bun test apps/realtime packages/realtime apps/web/src/lib/realtime.test.ts apps/web/src/routes/examples/realtime.test.tsx && rtk bun run --cwd apps/realtime check-types`

Expected: unauthorized joins receive `{ ok: false }`; invalid publisher calls
are rejected; an authorized client receives events and reconnect/event triggers
only query invalidation; the example route closes its socket on unmount.

- [x] **Step 5: Commit realtime client/server behavior.**

```bash
rtk git add apps/realtime apps/web packages/realtime README.md bun.lock
rtk git commit -m "feat(realtime): refetch after socket notifications"
```

### Task 9: Containerize the five runtime topology and finish documentation

**Files:**
- Delete: `Dockerfile.web`, `Dockerfile.worker`, `Dockerfile.scheduler`
- Create: `Dockerfile.web`, `Dockerfile.worker`, `Dockerfile.scheduler`, `Dockerfile.migrate`
- Modify: `Dockerfile.realtime`, `docker-compose.yml`, `README.md`, `AGENTS.md`, `.agent/{architecture,config,scheduler,ui,web,worker}.md`, `Taskfile.yml`, `config/{base,web,worker,scheduler,realtime}.yaml`
- Test: `scripts/check-taskfile.test.ts` (create if no static command validation exists)

- [x] **Step 1: Write failing topology documentation/Taskfile tests.**

```ts
test("documents TanStack Start embedded Elysia and Go River worker", async () => {
  const readme = await Bun.file("README.md").text();
  expect(readme).toContain("TanStack Start");
  expect(readme).toContain("embedded Elysia");
  expect(readme).toContain("Go/River");
  expect(readme).not.toContain("Next.js");
  expect(readme).not.toContain("pg-boss");
});
```

- [x] **Step 2: Run the test to verify it fails.**

Run: `rtk bun test scripts/check-taskfile.test.ts`

Expected: FAIL because the README and Taskfile still describe Next.js/pg-boss.

- [x] **Step 3: Build reproducible runtime images and Compose dependencies.**

Use Bun 1.3.14/Turbo prune for web, scheduler, and realtime images; web builds
Vite/Nitro and starts `.output/server/index.mjs`. Build the Go worker from
`golang:1.25.7-alpine`, copy its binary to a minimal runner containing its config
only, and run it as an unprivileged user. `Dockerfile.migrate` must include Bun,
Prisma CLI/workspaces, and the compiled `apps/migrate` binary because its command
applies Prisma first and River second.

Compose services must be: `db`, one-shot `migrate`, `web` depending on successful
migration, optional `worker` and `scheduler` in `jobs`, and optional `realtime`
in `realtime`. Worker receives `WORKER_NOTIFICATION_URL=http://web:4100/api/internal/worker-events`; web receives the private realtime URL; public ports are web 4100 and realtime 4102 only. Remove the standalone API service/health command from default composition.

Rewrite README/AGENTS/agent documents with exact ownership, `task doctor`, `task migrate`,
`task dev -- web worker scheduler realtime`, Docker profile instructions, River
cross-language contract rules, embedded Elysia route location, and Elysia's
worker-notification gateway. Update all runtime YAML modules and `.env.example`
 with the three paired realtime API keys/URLs while keeping credentials server-only;
`VITE_REALTIME_URL` and `REALTIME_CORS_ORIGIN` are the only browser/network
origin values permitted to be public.

- [x] **Step 4: Run documentation and container checks.**

Run: `rtk bun test scripts/check-taskfile.test.ts && rtk docker compose config && rtk task doctor`

Expected: static test passes; Compose configuration has a one-shot migrate
dependency and no exposed API port; doctor confirms Bun, Go, Task, Docker, and
required environment configuration.

- [x] **Step 5: Commit the operating surface.**

```bash
rtk git add Dockerfile.* docker-compose.yml README.md AGENTS.md .agent config .env.example Taskfile.yml scripts
rtk git commit -m "docs: document hybrid runtime operations"
```

### Task 10: Run end-to-end verification and record the template baseline

**Files:**
- Modify: `README.md` only if verification exposes an inaccurate command/result

- [x] **Step 1: Run narrow tests in dependency order.**

Run:

```bash
rtk bun test apps/api packages/queue apps/scheduler packages/realtime apps/realtime apps/web
rtk go test ./... -count=1
```

Expected: all TypeScript and Go tests pass.

- [x] **Step 2: Run repository quality checks.**

Run: `rtk task quality`

Expected: tests, linting, and typechecks pass with no generated-file diff.

- [x] **Step 3: Run build and Compose smoke tests.**

Run:

```bash
rtk task build
rtk docker compose up --build -d
rtk curl --fail http://localhost:4100/health
rtk curl --fail http://localhost:4100/api/status
rtk docker compose --profile jobs --profile realtime up --build -d
rtk docker compose down
```

Expected: web serves embedded Elysia health/status, migration completes before
web/jobs start, and all containers stop cleanly.

- [x] **Step 4: Commit final verification-only corrections, if any.**

```bash
rtk git status --short
rtk git add README.md
rtk git commit -m "docs: correct hybrid boilerplate commands"
```

Only create this commit if verification required an actual README correction;
otherwise leave the worktree clean without an empty commit.

## Plan self-review

- Spec coverage: Tasks 2–3 implement TanStack Start, shadcn/Tailwind, and embedded
  Elysia; Task 4 implements cross-language River enqueueing; Task 5 implements
  Go worker/migration behavior; Tasks 6–7 implement the Elysia-to-Socket.IO
  notification relay; Task 8 covers config, Taskfile, Compose, images, docs, and
  agent guidance; Task 9 verifies all required boundaries.
- Consistency: TypeScript job `kind`/JSON contracts are produced only by
  `packages/queue`; Go consumes River and posts only to
  `/api/internal/worker-events`; Elysia alone forwards to Socket.IO. Health is
  mounted through a dedicated embedded TanStack Start route, and worker-event
  publication failures become River-retryable 503 responses.
- Scope: no product model, authentication model, Redis, or multi-instance
  Socket.IO adapter is introduced. The single `example.realtime-notification.v1`
  contract is opt-in executable documentation, not a product job or default
  schedule.
