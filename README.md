# vkit-orbit

Domain-neutral hybrid boilerplate for TanStack Start, embedded Elysia, Prisma,
Bun/River producers, a Go/River worker, and optional Socket.IO realtime.

## Runtime topology

`apps/web` is the only public application server. TanStack Start mounts the
Elysia app directly through `apps/web/src/routes/api.$.ts`; there is no API
proxy or separate API process in the default Compose topology. `/health` is the
only non-`/api` Elysia mount. Web uses Tailwind CSS and shadcn/ui primitives.

```text
Browser -- same-origin /api/* --> TanStack Start + embedded Elysia --> Prisma --> PostgreSQL
Browser ----------------------> Socket.IO (optional apps/realtime)
apps/scheduler -- River TypeScript insert --------------------------> PostgreSQL
apps/worker ---- Go/River consume --> POST Elysia worker gateway --> Socket.IO
apps/migrate -- Prisma deploy, then River migrations -------------> PostgreSQL
```

Workspace ownership is explicit: `apps/web` owns routes and browser clients;
`apps/api` owns Elysia validation/envelopes and the worker notification gateway;
`packages/application` owns TypeScript business rules; `packages/database` owns
Prisma; `packages/queue` owns River TypeScript contracts/producers;
`apps/scheduler` only schedules/enqueues; `apps/worker` owns Go/River handlers;
`apps/realtime` owns Socket.IO ticket/room authorization and its private
publisher endpoint; `apps/migrate` owns one-shot migration orchestration.

## Quick start

Prerequisites: Bun 1.3.14, Go 1.25.7, Task, Docker, and PostgreSQL (or Compose).

```bash
task install
cp .env.example .env
task doctor
task migrate
task dev -- web
```

Run multiple local runtimes with `task dev -- web worker scheduler realtime`.
The example schedule is disabled by default; enable it only with
`ENABLE_EXAMPLE_SCHEDULE=true`.

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

## Opt-in worked example

`example.realtime-notification.v1` is the sole baseline job contract. Its JSON
payload contains `resourceId` and `workspaceId`; it writes no Prisma model.
The manual Elysia endpoint is
`POST /api/examples/realtime-notifications`. The scheduler enqueues it only
when explicitly enabled. The Go worker validates the same payload and, after
success, POSTs a `resource.updated` envelope to Elysia. Elysia authenticates
and forwards it to Socket.IO. The web walkthrough at
`/examples/realtime` accepts a product-issued ticket and invalidates/refetches
API-backed queries on events and reconnects. It is executable documentation,
not authentication or a default product feature.

River kinds and JSON payloads are cross-language contracts documented in
`contracts/jobs/README.md`; breaking changes use a new `.vN` kind.

## Commands

```text
task doctor                              Verify tools, env, and migration test
task migrate                             Prisma migrations, then River migrations
task dev                                 Web, Go worker, and scheduler
task dev -- web worker scheduler realtime Selected runtimes
task quality                             TypeScript tests/lint/types + Go vet
task build                               TypeScript build + Go binaries
task compose:up:detached                 Default db+migrate+web stack
task compose:jobs                        Optional worker and scheduler profile
task compose:realtime                    Optional Socket.IO profile
```

Compose exposes only web `4100` and realtime `4102`; the one-shot `migrate`
service must complete before web or optional jobs start.

## Scope rules

No auth system, product/domain model, Redis, multi-node Socket.IO adapter, or
default product schedule is included. Add product rules in the owning boundary,
write a failing focused test first, and run `task quality` and `task build`
before handoff.
