# Recipe-Only Realtime Example Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make scheduler and worker long-running, job-free baseline runtimes, and preserve the realtime-notification walkthrough as an installable recipe.

**Architecture:** The baseline retains generic River, Elysia notification, and Socket.IO infrastructure only. A signal-aware scheduler lifecycle owns shutdown and accepts an optional schedule-registration callback; the recipe supplies the example contract, route, timer, worker handler, and web route through explicit copy/integration instructions.

**Tech Stack:** Bun, TypeScript, TanStack Start, Elysia, River TypeScript/Go, PostgreSQL, Socket.IO.

## Global Constraints

- Baseline gains no example job, timer, API route, web route, credential, or product model.
- `apps/scheduler` and `apps/worker` must remain alive until `SIGINT` or `SIGTERM` even without consumer work.
- Workers notify Elysia only after successful work; Elysia alone publishes to Socket.IO.
- River payload-breaking changes require a new `.vN` kind.
- Write a failing focused test before each behavior change and preserve unrelated changes.

---

## File structure

- Create: `apps/scheduler/src/runtime.ts`, `apps/scheduler/src/runtime.test.ts` — signal-aware idle scheduler lifecycle.
- Modify: `apps/scheduler/src/main.ts`, `apps/scheduler/src/schedules.test.ts`, `packages/config/src/scheduler.ts`, `packages/config/src/scheduler.test.ts`, `config/scheduler.yaml` — remove example configuration and timer.
- Delete: `apps/scheduler/src/schedules.ts` — example-only baseline schedule.
- Modify: `apps/worker/main.go`, `apps/worker/main_test.go`, `apps/api/src/app.ts`, `apps/api/src/app.test.ts`, `apps/api/src/routes/index.ts`, `packages/queue/src/index.ts` — remove baseline example registration.
- Delete: `internal/worker/example_realtime_notification.{go,test.go}`, `apps/api/src/routes/examples.{ts,test.ts}`, `packages/queue/src/example-realtime-notification.{ts,test.ts}`, `apps/web/src/routes/examples/realtime.{tsx,test.tsx}` — relocate example-only files.
- Modify: `apps/web/src/routeTree.gen.ts` through TanStack Start route generation — remove `/examples/realtime`.
- Create: `recipes/realtime-notification/{README.md,tests/**,files/**}` — copy/install recipe, contract, source files, and integration instructions.
- Modify: `README.md`, `AGENTS.md`, `contracts/jobs/README.md`, `scripts/taskfile.test.ts` — document idle baseline and protect recipe isolation.

### Task 1: Make the scheduler an idle long-running runtime

**Files:**
- Create: `apps/scheduler/src/runtime.ts`
- Create: `apps/scheduler/src/runtime.test.ts`
- Modify: `apps/scheduler/src/main.ts`
- Delete: `apps/scheduler/src/schedules.ts`
- Modify: `apps/scheduler/src/schedules.test.ts`
- Modify: `packages/config/src/scheduler.ts`
- Modify: `packages/config/src/scheduler.test.ts`
- Modify: `config/scheduler.yaml`

**Interfaces:**
- Produces: `runScheduler(input: { register?: () => () => void; waitForShutdown?: () => Promise<void>; disconnect: () => Promise<void> }): Promise<void>`.
- Consumes: a recipe-installed `register` callback only; baseline calls no registration callback.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
test("keeps an idle scheduler alive until shutdown and then cleans up", async () => {
  let resolveShutdown!: () => void;
  let cleaned = false;
  const running = runScheduler({
    register: () => () => { cleaned = true; },
    waitForShutdown: () => new Promise<void>((resolve) => { resolveShutdown = resolve; }),
    disconnect: async () => {},
  });
  await Bun.sleep(0);
  expect(cleaned).toBe(false);
  resolveShutdown();
  await running;
  expect(cleaned).toBe(true);
});
```

Also replace schedule tests with a source assertion that baseline no longer has `registerSchedules`, `exampleRealtimeNotificationJob`, or `setInterval`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `bun test apps/scheduler/src/runtime.test.ts apps/scheduler/src/schedules.test.ts packages/config/src/scheduler.test.ts`

Expected: FAIL because `runScheduler` does not exist and scheduler config still exposes example values.

- [ ] **Step 3: Implement the minimal scheduler lifecycle and config removal**

```ts
export async function runScheduler({ register = () => () => {}, waitForShutdown = waitForTermination, disconnect }: SchedulerRuntimeInput) {
  const cleanup = register();
  try {
    await waitForShutdown();
  } finally {
    cleanup();
    await disconnect();
  }
}
```

Implement `waitForTermination()` with one-time `SIGINT` and `SIGTERM` listeners that resolve once and remove both listeners. Make `main.ts` call `createSchedulerConfig(process.env)` for existing server configuration validation, then `void runScheduler({ disconnect: () => prisma.$disconnect() })`. Remove the example keys from `createSchedulerConfig` and `config/scheduler.yaml`; delete `schedules.ts` and replace its test with the isolation assertion.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `bun test apps/scheduler packages/config/src/scheduler.test.ts`

Expected: PASS; the scheduler lifecycle remains pending until the injected shutdown promise resolves and no example config is parsed.

- [ ] **Step 5: Commit**

```bash
git add apps/scheduler packages/config/src/scheduler.ts packages/config/src/scheduler.test.ts config/scheduler.yaml
git rm apps/scheduler/src/schedules.ts
git commit -m "fix(scheduler): keep idle runtime alive"
```

### Task 2: Remove example behavior from baseline queue, API, worker, and web

**Files:**
- Modify: `apps/worker/main.go`, `apps/worker/main_test.go`, `apps/api/src/app.ts`, `apps/api/src/app.test.ts`, `apps/api/src/routes/index.ts`, `packages/queue/src/index.ts`
- Delete: `internal/worker/example_realtime_notification.go`, `internal/worker/example_realtime_notification_test.go`, `apps/api/src/routes/examples.ts`, `apps/api/src/routes/examples.test.ts`, `packages/queue/src/example-realtime-notification.ts`, `packages/queue/src/example-realtime-notification.test.ts`, `apps/web/src/routes/examples/realtime.tsx`, `apps/web/src/routes/examples/realtime.test.tsx`
- Modify: `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Consumes: `NewWorkerClient(database, nil)` builds a valid River client with zero registered example handlers.
- Produces: `createApp()` exposes only generic health, status, and internal notification routes.

- [ ] **Step 1: Write failing isolation tests**

```ts
test("baseline API and queue do not expose the realtime example", async () => {
  expect(await Bun.file("apps/api/src/app.ts").text()).not.toContain("exampleRealtimeNotificationJob");
  expect(await Bun.file("packages/queue/src/index.ts").text()).not.toContain("example-realtime-notification");
  expect(await Bun.file("apps/web/src/routeTree.gen.ts").text()).not.toContain("/examples/realtime");
});
```

Add a Go test that reads `apps/worker/main.go` and asserts it does not contain `ExampleRealtimeNotificationWorker` or `notify.NewNotifier`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `bun test apps/api/src/app.test.ts apps/web/src/routes/__root.test.tsx packages/queue/src && go test ./apps/worker -count=1`

Expected: FAIL because baseline imports/registers the example and the route tree retains the walkthrough.

- [ ] **Step 3: Remove only example-owned registrations and files**

Remove queue example exports and API `enqueueExample` dependencies/default River client creation. Remove `createExampleRoutes` from routes and `createApp`. In the worker, remove `net/http`, notifier, and example worker imports; construct `NewWorkerClient(database, nil)`. Delete the example files and regenerate route tree by running the web build, not by hand-editing generated routes.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `bun test apps/api apps/web packages/queue && go test ./apps/worker ./internal/river -count=1 && bun run --cwd apps/web build`

Expected: PASS; no baseline example endpoint, contract, handler, or web route remains while generic internal notifications still pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api apps/worker apps/web packages/queue
git rm internal/worker/example_realtime_notification.go internal/worker/example_realtime_notification_test.go apps/api/src/routes/examples.ts apps/api/src/routes/examples.test.ts packages/queue/src/example-realtime-notification.ts packages/queue/src/example-realtime-notification.test.ts apps/web/src/routes/examples/realtime.tsx apps/web/src/routes/examples/realtime.test.tsx
git commit -m "refactor(baseline): remove realtime example behavior"
```

### Task 3: Package the executable realtime walkthrough as a recipe

**Files:**
- Create: `recipes/realtime-notification/README.md`
- Create: `recipes/realtime-notification/files/contracts/jobs/example.realtime-notification.v1.md`
- Create: `recipes/realtime-notification/files/packages/queue/src/example-realtime-notification.ts`
- Create: `recipes/realtime-notification/files/apps/api/src/routes/examples.ts`
- Create: `recipes/realtime-notification/files/apps/scheduler/src/schedules.ts`
- Create: `recipes/realtime-notification/files/apps/worker/internal/worker/example_realtime_notification.go`
- Create: `recipes/realtime-notification/files/apps/web/src/routes/examples/realtime.tsx`
- Create: `recipes/realtime-notification/files/integration/{api,worker,scheduler,web}.md`
- Create: `recipes/realtime-notification/tests/{contract,installation,isolation}.test.ts`

**Interfaces:**
- Produces: `exampleRealtimeNotificationJob` with kind `example.realtime-notification.v1` and `{ resourceId, workspaceId }` payload.
- Produces: `registerSchedules(dependencies, { intervalMs })` whose cleanup clears the recipe timer.
- Consumes: consumer-provided notifier credentials, realtime ticket, queue client, and explicit route/worker registration.

- [ ] **Step 1: Write failing recipe contract and installation tests**

```ts
test("recipe documents every deliberate integration point", async () => {
  const readme = await Bun.file("recipes/realtime-notification/README.md").text();
  for (const section of ["Queue contract", "API registration", "Scheduler registration", "Worker registration", "Web route registration", "Removal"]) {
    expect(readme).toContain(section);
  }
});

test("recipe keeps the versioned example payload", async () => {
  const source = await Bun.file("recipes/realtime-notification/files/packages/queue/src/example-realtime-notification.ts").text();
  expect(source).toContain('"example.realtime-notification.v1"');
  expect(source).toContain("resourceId");
  expect(source).toContain("workspaceId");
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `bun test recipes/realtime-notification/tests`

Expected: FAIL because the recipe directory is absent.

- [ ] **Step 3: Add recipe files and explicit integration instructions**

Copy the former example code into `files/` with imports targeted at the consumer destination. In `scheduler` integration, instruct consumers to call:

```ts
await runScheduler({
  register: () => registerSchedules({ enqueue: (contract, payload) => enqueue(river, contract, payload) }, { intervalMs: 300_000 }),
  disconnect: () => prisma.$disconnect(),
});
```

In worker integration, instruct consumers to register `ExampleRealtimeNotificationWorker` with a notifier created from server-only configuration. In API integration, instruct consumers to add `createExampleRoutes(enqueueExample)` to the app factory. In web integration, instruct consumers to copy the route and regenerate `routeTree.gen.ts`. Document that no recipe file is imported by baseline automatically.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `bun test recipes/realtime-notification/tests`

Expected: PASS; recipe documents all copy targets and retains the exact v1 contract without baseline imports.

- [ ] **Step 5: Commit**

```bash
git add recipes/realtime-notification
git commit -m "feat(recipe): add realtime notification walkthrough"
```

### Task 4: Update baseline guidance and final isolation checks

**Files:**
- Modify: `README.md`, `AGENTS.md`, `contracts/jobs/README.md`, `scripts/taskfile.test.ts`
- Create: `scripts/realtime-example-isolation.test.ts`

**Interfaces:**
- Produces: baseline documentation that advertises no default job/schedule and points consumers to `recipes/realtime-notification/`.

- [ ] **Step 1: Write failing documentation/isolation test**

```ts
test("baseline has no example schedule or route", async () => {
  const sources = await Promise.all([
    Bun.file("README.md").text(),
    Bun.file("AGENTS.md").text(),
    Bun.file("config/scheduler.yaml").text(),
  ]);
  expect(sources.join("\n")).not.toContain("ENABLE_EXAMPLE_SCHEDULE");
  expect(sources.join("\n")).toContain("recipes/realtime-notification");
});
```

- [ ] **Step 2: Run focused tests and verify RED**

Run: `bun test scripts/realtime-example-isolation.test.ts scripts/taskfile.test.ts`

Expected: FAIL because baseline documentation still describes the opt-in example schedule.

- [ ] **Step 3: Update guidance without changing topology**

Replace the baseline example sections in README, AGENTS, and contracts documentation with recipe installation guidance. Keep Taskfile `dev:bg` as the long-running worker/scheduler/realtime group and add an assertion that it remains available. Do not add a recipe task or route to baseline.

- [ ] **Step 4: Run final verification**

Run: `bun test scripts/realtime-example-isolation.test.ts scripts/taskfile.test.ts recipes/realtime-notification/tests && task quality && task build`

Run isolated Compose smoke: `docker compose -p vkit-orbit-recipe-smoke up --build -d`, then `curl --fail http://localhost:4100/health`, then `docker compose -p vkit-orbit-recipe-smoke down -v`.

Expected: all tests/builds pass; web becomes healthy while jobs/realtime remain opt-in and baseline scheduler has no default enqueue side effect.

- [ ] **Step 5: Commit**

```bash
git add README.md AGENTS.md contracts/jobs/README.md scripts
git commit -m "docs: document recipe-only realtime example"
```
