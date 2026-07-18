# AGENTS.md

## Start here

Read `README.md`, the relevant `.agent/*.md`, the plan/spec, and run
`rtk git status --short` before changing code. Preserve unrelated changes.

## Repository shape

- `apps/web`: TanStack Start, Tailwind/shadcn UI, Eden clients, and the thin
  embedded Elysia adapters at `src/routes/api.$.ts` and `src/routes/health.ts`.
- `apps/api`: Elysia factory, validation, envelopes, usecase transport, and the
  authenticated `/api/internal/worker-events` gateway.
- `packages/database`: the only Prisma client owner and migration source.
- `packages/application`: TypeScript business rules and transactions.
- `packages/queue`: River TypeScript producer and versioned JSON contracts.
- `apps/scheduler`: Bun enqueue-only schedules; no Prisma business reads.
- `apps/worker`: Go/River handlers, retries, idempotency, and Elysia notifier.
- `apps/realtime`: Socket.IO auth, room authorization, and private publisher.
- `apps/migrate`: Prisma deploy first, River migration second.

## Architecture rules

The web process is the only default public HTTP server. Do not add a network
API proxy or second business transport. Elysia owns `/api`; process health is
under `/health`. Server loaders may call embedded Elysia directly; browser code
uses the same-origin route and typed Eden.

Only `packages/database` creates Prisma clients. Do not expose `DATABASE_URL`
or other credentials to browser code. Use the YAML/config loaders rather than
reading `process.env` in feature code.

River `kind` and JSON payloads are cross-language contracts. Breaking changes
use a new versioned kind. Go workers must not duplicate TypeScript usecases.
Workers notify Elysia only after successful job completion; Elysia alone talks
to Socket.IO. Realtime payloads are invalidation signals, not source-of-truth
data.

The only baseline example is opt-in `example.realtime-notification.v1`; it has
no product model, auth implementation, or default schedule.

## Workflow

For every behavior change: write a focused failing test, run it and inspect the
expected failure, implement the smallest fix, run focused tests/typechecks,
then commit the task with its planned conventional message. Use `rtk` before
every shell command. Prefer `task` commands. Before completion run focused
tests, `rtk task quality`, `rtk task build`, and Compose smoke checks.
