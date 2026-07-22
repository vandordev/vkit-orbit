# Runtime Hardening Design

## Goal

Bring the proven, domain-neutral runtime corrections from Broadcaster into the
default boilerplate without changing its public topology or adding a product
model.

## Scope

- Run the embedded web/API process on port `4100` by default, including the
  OpenAPI server URL.
- Use TanStack Start as the sole router integration; do not register a second
  TanStack Router Vite plugin.
- Run Prisma migration commands as `bun run --cwd packages/database db:migrate`.
- Load the base configuration before `task migrate` launches the Go migration
  process.
- Put River migrations and the Go worker client in the dedicated `river`
  PostgreSQL schema, including a safe migration for River's helper function.
- Accept either a base URL or the full `/api/internal/worker-events` endpoint
  as the worker notification URL.
- Minimize the web and migration Docker runtime dependency sets.
- Retain selectable local development runtimes; realtime remains opt-in.

## Out of scope

- Authentication, domain models, provider clients, UI, and product schedules.
- Changing Compose's public service topology.
- Adding default development secrets.

## Design

`apps/web` remains the only public HTTP server. `PORT`, `CORS_ORIGIN`, and
`OPENAPI_SERVER_URL` must consistently describe the same local public origin.
TanStack Start owns route generation and routing configuration, so the separate
router Vite plugin is removed.

The migration runtime remains ordered: Prisma deploy first, River second. It
receives `DATABASE_URL` through the existing YAML-first config runner. River
objects, including its migration metadata and helper function, live in schema
`river`; both `apps/migrate` and `internal/river` use that schema explicitly.

The notification client normalizes one optional trailing worker-events path
before appending its request route. A malformed or failed notification remains
an error so River can retry the job.

Docker builds preserve the existing Turbo prune approach. The web runner gets
only production dependencies plus Prisma runtime artifacts. The migration
image installs only the database workspace dependencies and copies only its
runtime inputs.

## Acceptance criteria

- A config test asserts port and local OpenAPI URL default to `4100`.
- A Vite config test proves only TanStack Start supplies routing integration.
- Migration tests assert the exact Prisma command, Prisma-before-River order,
  and schema `river` on both migration and worker clients.
- A migration safely moves an existing River helper function from `public` to
  `river` when it exists and is harmless when it does not.
- Notifier tests cover base URL and full worker-events URL forms.
- Dockerfile tests assert production dependency installation for web and the
  limited dependency copy/install behavior for migrate.
- `task quality`, `task build`, and the relevant Compose smoke checks pass.
