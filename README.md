# vkit-orbit

Document Processing Hub runtime with TanStack Start, standalone Elysia `/v1`,
Prisma, BullMQ/Redis workers, MinIO, and Socket.IO invalidation events.

## Runtime topology

`apps/web` serves the dashboard and same-origin tRPC. `apps/api` is the
standalone public Elysia `/v1` server, not a browser proxy. Web uses Tailwind
CSS and shadcn/ui primitives.

Web routing is directory-first under `apps/web/src/app`; see
[.agent/web/routing.md](.agent/web/routing.md) for native TanStack tokens,
generated-tree ownership, and adapter isolation rules.

Web brand defaults are centralized in `apps/web/src/lib/config.ts`; see the
[web guidance](.agent/web/README.md) before changing application metadata or
public brand copy.

```text
Browser -- same-origin /trpc --> TanStack Start --> PostgreSQL
External clients -------- /v1 --> standalone Elysia --> PostgreSQL
Browser ----------------------> Socket.IO invalidation (apps/realtime)
apps/scheduler -- BullMQ schedules ---------------------------------> Redis
apps/worker ---- TypeScript consume --------------------------------> PostgreSQL
apps/migrate -- Prisma deploy -------------------------------------> PostgreSQL
```

Workspace ownership is explicit: `apps/web` owns routes and browser clients;
`apps/api` owns Elysia validation/envelopes and the worker notification gateway;
`packages/application` owns TypeScript business rules; `packages/database` owns
Prisma; `packages/queue` owns BullMQ contracts/producers;
`apps/scheduler` only schedules/enqueues; `apps/worker` owns TypeScript handlers;
`apps/realtime` owns Socket.IO ticket/room authorization and its private
publisher endpoint; `apps/migrate` owns one-shot migration orchestration.

## Quick start

Prerequisites: Bun 1.3.14, Task, Docker, and PostgreSQL (or Compose).

```bash
task install
cp .env.example .env
task doctor
task migrate
task dev -- web
```

Run multiple local runtimes with `task dev -- web worker scheduler realtime`.
The scheduler and worker are idle long-running runtimes until a consumer
installs domain work.

## Configuration

Configuration is YAML-first and loaded per runtime from `config/`. Secrets are
server-only: `DATABASE_URL`, worker keys, realtime internal URLs, and publisher
keys never enter browser code. The only browser-visible origin is
`VITE_REALTIME_URL`, consumed through Vite `import.meta.env`.

Realtime credentials are paired across the boundaries:

- API: `WORKER_NOTIFICATION_API_KEY`, `REALTIME_INTERNAL_URL`,
  `REALTIME_PUBLISH_API_KEY`;
- worker: `WORKER_NOTIFICATION_URL`, `WORKER_NOTIFICATION_API_KEY`;
- realtime: `REALTIME_PUBLISH_API_KEY`, `REALTIME_CORS_ORIGIN`, and ticket secret;
- web: public `VITE_REALTIME_URL` only.

## Operations and realtime

The product runtime is installed by default. Realtime carries invalidation
signals only; clients refetch authoritative tRPC data. Structured logs use
bounded correlation context and redact credentials, URLs, cookies, and content.
Actionable recovery procedures are in `docs/runbooks/`.

BullMQ job kinds and JSON payloads are contracts documented in
`contracts/jobs/README.md`; breaking changes use a new `.vN` kind.

## Commands

```text
task doctor                              Verify tools, env, and migration test
task migrate                             Prisma migrations
task dev                                 Web, worker, and scheduler
task dev -- web worker scheduler realtime Selected runtimes
task quality                             TypeScript tests/lint/types
task build                               TypeScript builds
task compose:up:detached                 Default db+migrate+web stack
task compose:jobs                        Optional worker and scheduler profile
task compose:realtime                    Optional Socket.IO profile
```

Compose exposes only web `4100`, API `4101`, and realtime `4102`; the one-shot
`migrate` service must complete before dependent services start.

## Scope rules

Initial support is `.txt` and `.md`; OCR, PDF/DOCX, AI, and compatibility layers
are excluded. Add product rules in the owning boundary, write a failing focused
test first, and run `task quality`, `task build`, and Compose smoke before handoff.
