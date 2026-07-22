# Runtime Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the default runtime consistent, schema-isolated, and smaller in production without changing its public topology.

**Architecture:** Preserve `apps/web` as the public server. Align configuration, Vite, migration orchestration, River clients, and images around that topology; each correction has a regression test in its current owning boundary.

**Tech Stack:** Bun, TanStack Start, Elysia, Go, River, PostgreSQL, Docker, Task.

---

## File structure

- Modify: `config/api.yaml`, `packages/config/src/api.test.ts` — public-origin defaults.
- Modify: `apps/web/vite.config.ts`, `apps/web/vite.config.test.ts` — one routing plugin.
- Modify: `apps/migrate/main.go`, `apps/migrate/main_test.go`, `internal/river/client.go`, `internal/river/client_test.go` — River schema and migration command.
- Create: `packages/database/prisma/migrations/20260723000000_move_river_helper_to_schema/migration.sql` — compatibility migration.
- Modify: `Taskfile.yml`, `scripts/taskfile.test.ts`, `internal/notify/client.go`, `internal/notify/client_test.go` — operational boundaries.
- Modify: `Dockerfile.web`, `Dockerfile.migrate`, `scripts/dockerfiles.test.ts` — production image minimisation.

### Task 1: Align web origin and Vite ownership

- [ ] Write failing tests asserting `createApiConfig(...).port === 4100`, the default OpenAPI URL is `http://localhost:4100`, and `vite.config.ts` contains `tanstackStart` but not `tanstackRouter(`.
- [ ] Run `rtk bun test packages/config/src/api.test.ts apps/web/vite.config.test.ts`; expect failures against the old `4101` and duplicate plugin.
- [ ] Change YAML defaults to `4100` and remove the router-plugin import and invocation, retaining `tanstackStart({ router: { routeFileIgnorePattern: "\\.test\\." } })`.
- [ ] Re-run the focused tests; expect PASS. Commit `fix(web): align embedded runtime defaults`.

### Task 2: Isolate River migrations and worker client

- [ ] Extend migration tests to expect `bun run --cwd packages/database db:migrate` before `river up`; add `TestRiverSchemaIsDedicated` in both Go test packages.
- [ ] Run `rtk go test ./apps/migrate ./internal/river -count=1`; expect the exact-command and schema tests to fail.
- [ ] Define `const riverSchema = "river"`; pass `&rivermigrate.Config{Schema: riverSchema}` to `rivermigrate.New` and `Schema: riverSchema` to `river.NewClient`. Change the Prisma command to `bun run --cwd packages/database db:migrate`.
- [ ] Create a Prisma SQL migration using `to_regprocedure` and `ALTER FUNCTION ... SET SCHEMA river` only when the public helper exists.
- [ ] Re-run focused Go tests and `rtk task migrate` against Compose PostgreSQL. Commit `fix(river): isolate migration schema`.

### Task 3: Make Task and notifier inputs unambiguous

- [ ] Add a Taskfile source assertion that `migrate` invokes `packages/config/src/run.ts --modules base -- go run ./apps/migrate`; add a notifier test whose configured URL ends in `/api/internal/worker-events`.
- [ ] Run `rtk bun test scripts/taskfile.test.ts internal/notify`; expect failures.
- [ ] Update `Taskfile.yml` to launch migrate through `rtk bun --env-file=.env run packages/config/src/run.ts --modules base -- go run ./apps/migrate`. In `NewNotifier`, trim the trailing slash and then trim one `/api/internal/worker-events` suffix before `Notify` appends it.
- [ ] Re-run `rtk bun test scripts/taskfile.test.ts` and `rtk go test ./internal/notify -count=1`; expect PASS. Commit `fix(ops): harden migration and notifier inputs`.

### Task 4: Minimise deployment images

- [ ] Add source tests that require a `runtime-deps` stage with `bun install --production` in `Dockerfile.web`, Prisma artifacts copied from builder, and a database-only dependency install in `Dockerfile.migrate`.
- [ ] Run `rtk bun test scripts/dockerfiles.test.ts`; expect failures.
- [ ] Implement the two multi-stage changes while retaining Bun/Go versions, non-root web runner, and existing runtime commands.
- [ ] Run `rtk bun test scripts/dockerfiles.test.ts`, `rtk task quality`, `rtk task build`, then Compose web/migration smoke checks. Commit `build: minimize hybrid runtime images`.
