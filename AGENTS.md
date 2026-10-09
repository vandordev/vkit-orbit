# AGENTS.md

## Start here

Read `README.md`, the relevant `.agent/**/*.md` files for the runtime being
changed, the plan/spec, and run
`git status --short` before changing code. Preserve unrelated changes.

## Repository shape

- `apps/web`: TanStack Start, Tailwind/shadcn UI, and same-origin tRPC.
- `apps/storybook`: repository-wide presentation previews; stories stay colocated
  with their owning components. Development tooling only, not a deployed runtime.
- `packages/components`: shared Vandor UI source, imported through explicit
  `@repo/components/<name>` entrypoints. All new small UI primitives belong here,
  never in application-local copies. Unmigrated existing presentation stays intact.
- `apps/api`: Elysia factory, validation, envelopes, usecase transport, and the
  authenticated `/api/internal/worker-events` gateway.
- `packages/database`: the only Prisma client owner and migration source.
- `packages/application`: TypeScript business rules and transactions.
- `packages/queue`: BullMQ producer and versioned JSON contracts.
- `apps/scheduler`: Bun lifecycle and consumer-installed enqueue-only schedules;
  no Prisma business reads.
- `apps/worker`: long-running TypeScript/BullMQ runtime plus consumer-installed
  handlers, retries, idempotency, and Elysia notifier.
- `apps/realtime`: Socket.IO auth, room authorization, and private publisher.
- `apps/migrate`: Prisma deploy first.

## Architecture rules

The web process hosts the dashboard and same-origin tRPC. `apps/api` is the
standalone public Elysia `/v1` server, not a proxy. Process health is exposed
by each runtime's health endpoint.

Only `packages/database` creates Prisma clients. Do not expose `DATABASE_URL`
or other credentials to browser code. Use the YAML/config loaders rather than
reading `process.env` in feature code.

BullMQ job names and JSON payloads are cross-runtime contracts. Breaking
changes use a new versioned kind. Workers notify Elysia only after successful
job completion; Elysia alone talks to Socket.IO.
Realtime payloads are invalidation signals, not source-of-truth data.

The product runtime is installed by default; no compatibility recipe is part of
the active architecture.

## Workflow

Follow `.agent/verification.md` for the active, risk-based verification policy.
Typesafe wiring/refactors normally stop after a fresh successful native typecheck.
For runtime invariants types cannot prove, use focused tests, test-first when
meaningful. Do not automatically run `task quality`, repository builds, or Compose.
These commands remain available for explicitly scoped integrated checks.

UI follows component-driven design: check schema and runtime feasibility, build
typed presentation components with colocated stories, verify them in Storybook,
then integrate routes and tRPC. Keep fetching, authorization, and navigation out
of presentation components. Read `.agent/web/README.md` and the Storybook README.
For shared UI, read `.agent/components.md` and `packages/components/README.md`.
Prefer `task` commands. Preserve unrelated changes and report exactly what was
verified and what remains unresolved. Commit completed tasks with an appropriate
conventional message; no automatic merge or push.
