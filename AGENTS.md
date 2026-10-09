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
- `packages/brand`: source of truth for brand name, logo, and color tokens.
  Consumers use `@repo/brand` entrypoints; do not duplicate identity or palette.
- `apps/api`: Elysia factory, validation, envelopes, usecase transport, and the
  authenticated `/api/internal/worker-events` gateway.
- `packages/db`: the only Prisma client owner and migration source.
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

Only `packages/db` creates Prisma clients. Do not expose `DATABASE_URL`
or other credentials to browser code. Use the YAML/config loaders rather than
reading `process.env` in feature code.

Runtime configuration uses only `config/config.yaml` and lazy typed
`@repo/config/server` getters with explicit field isolation and Zod 4. Browser
imports are limited to `@repo/config/public`; deployment values arrive through
same-origin `config.public`, never Vite/public env or build injection. Prisma is
lazy and receives an explicit URL. Only narrow bootstrap/tool child-environment
adapters may emit environment settings; see `.agent/config.md`.

BullMQ job names and JSON payloads are cross-runtime contracts. Breaking
changes use a new versioned kind. Workers notify Elysia only after successful
job completion; Elysia alone talks to Socket.IO.
Realtime payloads are invalidation signals, not source-of-truth data.

The product runtime is installed by default; no compatibility recipe is part of
the active architecture.

## Workflow

Follow `.agent/verification.md` for the two verification tracks: UI uses Storybook
plus typecheck; system (all backend/database/service work, including web tRPC)
uses typecheck only. Never start Compose, containers, databases, backend services,
or execute system tests, migrations, builds, or full quality gates for verification.
Risk does not authorize extra runtime checks. Report runtime integrations as
unverified, not proven by typecheck. Exceptions require new explicit user instruction.

UI follows component-driven design: check schema and runtime feasibility, build
typed presentation components with colocated stories, verify them in Storybook,
then integrate routes and tRPC. Keep fetching, authorization, and navigation out
of presentation components. Read `.agent/web/README.md` and the Storybook README.
For shared UI, read `.agent/components.md` and `packages/components/README.md`.
For brand changes, read `packages/brand/README.md`; web config derives brand identity.
For TanStack Start SEO, use the `tanstack-seo` skill and `.agent/web/seo.md`;
adapt examples to `src/app`, existing brand/config ownership, and typecheck-only
system verification. Confirm public origin/indexing scope before implementation.
Prefer `task` commands. Preserve unrelated changes and report exactly what was
verified and what remains unresolved. Commit completed tasks with an appropriate
conventional message; no automatic merge or push.
