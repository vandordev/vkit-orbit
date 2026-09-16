# AGENTS.md

## Start here

Read `README.md`, the relevant `.agent/**/*.md` files for the runtime being
changed, the plan/spec, and run
`git status --short` before changing code. Preserve unrelated changes.

## Repository shape

- `apps/web`: TanStack Start, Tailwind/shadcn UI, and same-origin tRPC.
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

For every behavior change: write a focused failing test, run it and inspect the
expected failure, implement the smallest fix, run focused tests/typechecks,
then commit the task with its planned conventional message. Prefer `task`
commands. Before completion run focused
tests, `task quality`, `task build`, and Compose smoke checks.
