# vkit-orbit

Document Processing Hub runtime with TanStack Start, standalone Elysia `/v1`,
Prisma, BullMQ/Redis workers, MinIO, and Socket.IO invalidation events.

## Runtime topology

`apps/web` serves the dashboard and same-origin tRPC. `apps/api` is the
standalone public Elysia `/v1` server, not a browser proxy. Web uses Tailwind
CSS and shadcn/ui primitives.

New shared UI lives in [`packages/components`](packages/components/README.md),
installed from Vandor UI and imported via `@repo/components/<name>`. Button is the
initial example; existing web-local primitives remain transitional, not migrated.
See [component ownership and installation rules](.agent/components.md).

[`apps/storybook`](apps/storybook/README.md) hosts repository-wide component
previews. Stories remain colocated with their components. Run `task dev:storybook`
on port 6006 or `task build:storybook` for static output. New/changed UI follows
component-driven design: check data feasibility, develop typed components and
stories, verify in Storybook, then integrate routes/tRPC. See the active
[verification policy](.agent/verification.md).

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
task dev
```

Run worker, scheduler, and realtime in separate terminals with
`task dev:worker`, `task dev:scheduler`, and `task dev:realtime`.
The installed worker consumes document, webhook, notification, and maintenance
jobs; the scheduler periodically enqueues recovery and expired-upload scans.

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

Webhook creation requires `WEBHOOK_SECRET_ENCRYPTION_KEY` (64 hexadecimal
characters, shared by web/API/worker, stored outside source control). Signing
secrets are encrypted with AES-256-GCM and returned once. Existing hash-only
endpoints must be recreated to sign future events. Webhooks accept only public
HTTPS targets on port 443; delivery pins validated DNS addresses and does not
follow redirects.

## Operations and realtime

The product runtime is installed by default. Realtime carries invalidation
signals only; clients refetch authoritative tRPC data. Structured logs use
bounded correlation context and redact credentials, URLs, cookies, and content.
Actionable recovery procedures are in `docs/runbooks/`.

BullMQ job kinds and JSON payloads are contracts documented in
`contracts/jobs/README.md`; breaking changes use a new `.vN` kind.

## Commands

```text
task doctor                              Verify tools and local env presence
task migrate                             Prisma migrations
task dev                                 Web foreground
task dev:worker                           Document/webhook/notification workers
task dev:scheduler                        Enqueue-only maintenance schedules
task dev:realtime                         Socket.IO runtime
task dev:storybook                        Shared component previews on port 6006
task build:storybook                      Static Storybook build
task quality                             TypeScript tests/lint/types
task build                               TypeScript builds
task compose:up:detached                  Full installed runtime stack
task compose:smoke                        Disposable full-stack acceptance gate
```

Compose exposes only web `4100`, API `4101`, and realtime `4102`; the one-shot
`migrate` service must complete before dependent services start.

Tests never load `.env`; PostgreSQL integration tests create disposable
containers unless an explicit `TEST_DATABASE_URL` ending in `_test` is provided.
Test Redis requires an `orbit:test:<name>` prefix. Compose smoke uses its own
random project and volumes and excludes the developer `.env`; it still needs
ports 4100–4102 free. Never run destructive Redis recovery against a development
or production project.

## Scope rules

Initial support is `.txt` and `.md`; OCR, PDF/DOCX, AI, and compatibility layers
are excluded. Add product rules in the owning boundary. Follow
[risk-based verification](.agent/verification.md): typecheck typed wiring; use
focused tests for runtime invariants and browser Storybook checks for UI. Full
quality/build/Compose gates are deliberate integration checks, not automatic
requirements for every task. Do not apply remote migrations without authorization.
