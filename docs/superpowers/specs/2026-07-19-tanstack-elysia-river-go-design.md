# TanStack Start, Elysia, and River Go Boilerplate Design

## Goal

Evolve the vkit-rapid baseline into a domain-neutral monorepo that combines
TanStack Start for the web, Elysia and Prisma for the TypeScript API,
Bun/TypeScript scheduling, Socket.IO realtime delivery, and Go/River job
execution. The resulting boilerplate is deliberately hybrid: each runtime has
one responsibility and communicates through stable HTTP, database, and job
contracts.

## Source Strategy

Use vkit-rapid as the source for Elysia, Prisma, TypeScript usecases,
configuration, API response envelopes, and the Socket.IO publishing model. Use
vkit-tango selectively for the TanStack Start web setup, shadcn/ui baseline,
Go/River worker lifecycle, migration process, Taskfile ergonomics, and Docker
runtime patterns. Do not copy either repository wholesale.

## Scope

- Replace the Next.js web app with TanStack Start, Tailwind CSS, and shadcn/ui.
- Keep Elysia as the only business HTTP API and Prisma as the TypeScript domain
  database layer.
- Replace the TypeScript pg-boss worker with a Go worker that processes River
  jobs.
- Keep the scheduler in Bun/TypeScript, but make it a River TypeScript producer.
- Keep a dedicated Socket.IO TypeScript runtime for browser realtime updates.
- Add a one-shot Go migration app for Prisma domain migrations and River schema
  migrations.
- Include one opt-in, end-to-end `example.realtime-notification.v1` job so a
  new project can trace API enqueueing, scheduler enqueueing, Go processing,
  Elysia relay, Socket.IO delivery, and web invalidation without a product model.
- Update configuration, local containers, Taskfile commands, tests, and
  documentation for the new runtime topology.

## Non-goals

- Moving domain business rules from TypeScript usecases into Go.
- Replacing Prisma with a Go ORM or making Go the primary HTTP API.
- Adding Redis or another queue service.
- Introducing authentication, a sample product domain, or a default multi-node
  Socket.IO adapter.
- Treating realtime events as a client-side source of truth.
- Enabling the example schedule by default or treating its example ticket input
  as a product authentication system.

## Architecture

```text
Browser
  |-- Socket.IO --> apps/realtime
  '-- same-origin /api/* --> apps/web (TanStack Start route handler)
                                  |
                                  v
                             apps/api (embedded Elysia) --> Prisma --> PostgreSQL
                                  |                               |            |
                                  |                               |            v
                                  |                               |       River tables
                                  |                               |            |
                                  |                               v            v
                                  |                          transactional   apps/worker
                                  |                          River enqueue       (Go/River)
                                  |
                                  '-- authenticated publish --> apps/realtime

apps/scheduler (Bun/TypeScript) -- River enqueue --> PostgreSQL/River tables
apps/migrate (Go, one-shot) -- Prisma + River migrations --> PostgreSQL
```

### Workspace ownership

- `apps/web` owns TanStack Start routes, Tailwind/shadcn UI, browser data
  clients, and the `/api/*` server route handler that delegates to embedded
  Elysia. It owns no database or business logic.
- `apps/api` owns Elysia routes, validation, response mapping, request IDs,
  logging, health endpoints, an authenticated worker-notification endpoint, and
  forwarding validated notifications to realtime.
- `packages/application` continues to own TypeScript business rules and
  transactional mutation usecases. It does not import Elysia, TanStack Start,
  or Go code.
- `packages/database` continues to own Prisma schema, generated client, and
  domain migrations.
- `packages/queue` owns the River TypeScript producer, stable job-kind/payload
  contract definitions, and enqueue helpers used by the API and scheduler.
- `apps/scheduler` owns schedules and River enqueue options only. It does not
  perform domain mutations or access Prisma domain models directly.
- `apps/worker` owns Go/River worker setup, handler registration, retries,
  idempotency, graceful shutdown, and job logs. It executes Go-specific jobs;
  it must not duplicate TypeScript domain mutation logic.
- `apps/realtime` owns Socket.IO ticket validation, room authorization, and the
  authenticated internal publish endpoint.
- `apps/migrate` owns one-shot Prisma domain and River schema migration
  orchestration. Long-running runtimes never alter schema at startup.

## HTTP and Web Boundary

Elysia owns all business endpoints under `/api/*`; process health is exposed at
`/health`. It returns the existing envelope:

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: string;
  message: string;
  requestId?: string;
};
```

TanStack Start is the sole public web origin and embeds Elysia within its
`/api/*` server route handler. The handler delegates each supported HTTP method
directly to `app.fetch(request)`; it does not proxy across a network, define a
second set of business routes, or transform successful API responses. `apps/api`
exports the Elysia app factory and application type, but it is not a separate
long-running HTTP process in the default topology.

Eden uses an isomorphic client: server loaders call the embedded app directly
without HTTP overhead, while browser components call the same-origin `/api/*`
route through HTTP. This keeps one typed API boundary for both environments.

Read flow:

```text
Browser -> TanStack Start Elysia route handler -> Prisma -> PostgreSQL
```

Mutation flow:

```text
Browser -> embedded Elysia validation -> TypeScript usecase -> Prisma transaction
```

## River Queue Boundary

River is the sole durable queue and uses PostgreSQL. API and scheduler use the
official TypeScript River client and its Prisma or `pg` driver to enqueue jobs;
the Go worker consumes those jobs through River. A job has a stable unique
`kind` and a JSON payload contract. TypeScript validates job input before
enqueueing and Go decodes the matching payload struct before handling it.

Job contracts reside in `contracts/jobs/`. A breaking payload change requires a
new versioned kind or a backward-compatible decoder. API mutations that require
asynchronous work insert the River job in the same Prisma transaction as the
domain change. Scheduled jobs use River uniqueness options when duplicate
execution would be harmful.

The Go worker is intentionally not a second implementation of application
usecases. Jobs that need a domain mutation either use a narrowly defined API
boundary or are designed as Go-specific work from the outset; product code must
not silently encode the same business rule in both languages.

### Opt-in worked example

The boilerplate includes exactly one clearly named example contract:
`example.realtime-notification.v1`. Its JSON args contain `resourceId` and
`workspaceId`; it does not write a Prisma model. A manual Elysia example endpoint
can enqueue it, and the Bun scheduler can enqueue it only when
`ENABLE_EXAMPLE_SCHEDULE=true` (default false). The Go worker validates the
matching struct and, after successful completion, POSTs its `resource.updated`
event to Elysia. Elysia relays the validated event to Socket.IO. A web example
page accepts a product-issued ticket and demonstrates query invalidation on that
event or reconnect. This is executable documentation, not a default product
feature.

## Realtime Boundary

Elysia is the sole realtime gateway. It exposes an authenticated internal
notification endpoint for the Go worker. After a River job succeeds, the worker
POSTs a versioned event envelope to this endpoint; it never contacts Socket.IO
directly. Elysia validates the worker credential and event contract, then
forwards the event to the Socket.IO runtime's authenticated internal publish
endpoint. Elysia may use this same forwarding path for events caused by a
successful HTTP mutation, but only after its database transaction commits.

The realtime service emits only to contract-selected rooms after ticket
verification and product-supplied room authorization. The default authorization
hook denies room joins until a product supplies its rule.

Events are signals for clients to invalidate/refetch API-backed read models.
They do not replicate authoritative state, and reconnect always triggers a
typed HTTP resynchronization. The baseline remains single-instance; a
multi-instance Socket.IO adapter is an explicit future extension.

## Configuration and Operations

YAML-first configuration and secret interpolation remain the configuration
system. Runtime modules are scoped to `web`, `api`, `scheduler`, `realtime`,
and `worker`, with `storage` selected where needed; the one-shot migration
runtime receives `DATABASE_URL` directly and runs Prisma and River migrations.
Browser-visible config remains limited to deliberate public `VITE_*` values.
`DATABASE_URL` is never exposed to browser code.

Taskfile is the only supported command interface. It must expose focused
install, doctor, migration, development, test, build, and quality commands for
each runtime, plus an umbrella local-development command. Docker Compose runs
PostgreSQL, one-shot migrations, web with embedded Elysia, and optional
jobs/realtime profiles with the same runtime boundaries. There is no separate
API service in the default Compose topology.

## Failure Handling

- Elysia maps validation, known usecase, not-found, and unexpected failures to
  the standard failure envelope without exposing sensitive details.
- The TanStack Start route handler delegates to Elysia without changing API
  response semantics; Elysia owns all business and request-level failures.
- River owns retry, backoff, and failure state. All Go job handlers must be
  idempotent.
- Workers notify Elysia only after a River job succeeds. API-originated events
  are forwarded only post-commit, so aborted transactions cannot produce false
  events. Notification or publication failure is logged and observable; clients
  can still obtain authoritative data through HTTP.

## Verification

- Test Elysia routes and TypeScript usecases for validation, envelopes,
  transactions, and transactional enqueue behavior.
- Test the TanStack Start route handler for supported-method delegation to
  `app.fetch`, the Elysia response body/status, and same-origin browser access.
- Test River TypeScript job contract validation and scheduler enqueue/uniqueness
  behavior.
- Test Go River handlers for decoding, idempotency, retry-safe behavior, and
  registration.
- Test migration orchestration against an empty PostgreSQL instance.
- Test the Elysia worker-notification endpoint for authentication and event
  validation, then test forwarding, Socket.IO ticket/room authorization, and
  reconnect-driven HTTP resynchronization.
- Before integration, run focused tests followed by `task quality` and
  `task build`.
