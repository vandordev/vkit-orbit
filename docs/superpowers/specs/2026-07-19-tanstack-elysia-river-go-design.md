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
- Update configuration, local containers, Taskfile commands, tests, and
  documentation for the new runtime topology.

## Non-goals

- Moving domain business rules from TypeScript usecases into Go.
- Replacing Prisma with a Go ORM or making Go the primary HTTP API.
- Adding Redis or another queue service.
- Introducing authentication, a sample product domain, or a default multi-node
  Socket.IO adapter.
- Treating realtime events as a client-side source of truth.

## Architecture

```text
Browser
  |-- Socket.IO --> apps/realtime
  |-- same-origin /api/* --> apps/web (TanStack Start proxy)
                                  |
                                  v
                             apps/api (Elysia) --> Prisma --> PostgreSQL
                                  |                  |            |
                                  |                  |            v
                                  |                  |       River tables
                                  |                  |            |
                                  |                  v            v
                                  |             transactional   apps/worker
                                  |             River enqueue       (Go/River)
                                  |
                                  '-- post-commit internal publish --> apps/realtime

apps/scheduler (Bun/TypeScript) -- River enqueue --> PostgreSQL/River tables
apps/migrate (Go, one-shot) -- Prisma + River migrations --> PostgreSQL
```

### Workspace ownership

- `apps/web` owns TanStack Start routes, Tailwind/shadcn UI, browser data
  clients, and the narrowly scoped `/api/*` reverse proxy. It owns no database
  or business logic.
- `apps/api` owns Elysia routes, validation, response mapping, request IDs,
  logging, health endpoints, and API-to-realtime publication.
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

Elysia owns all business endpoints under `/api/v1/*`; process health endpoints
remain under `/health` and `/health/ready`. It returns the existing envelope:

```ts
type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: string;
  message: string;
  requestId?: string;
};
```

TanStack Start is the sole public web origin. Its `/api/*` proxy forwards
requests, response status, and response bodies to the independently deployable
Elysia API. It does not define a second set of business routes or transform
successful API responses. If the API is unreachable, it returns a controlled
gateway failure. This keeps browser calls same-origin while allowing the API to
scale and deploy independently.

Read flow:

```text
Browser -> TanStack Start proxy -> Elysia query route -> Prisma -> PostgreSQL
```

Mutation flow:

```text
Browser -> proxy -> Elysia validation -> TypeScript usecase -> Prisma transaction
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

## Realtime Boundary

After a successful transaction commits, Elysia publishes a validated event to
the Socket.IO runtime's authenticated internal endpoint. The realtime service
emits only to contract-selected rooms after ticket verification and
product-supplied room authorization. The default authorization hook denies room
joins until a product supplies its rule.

Events are signals for clients to invalidate/refetch API-backed read models.
They do not replicate authoritative state, and reconnect always triggers a
typed HTTP resynchronization. The baseline remains single-instance; a
multi-instance Socket.IO adapter is an explicit future extension.

## Configuration and Operations

YAML-first configuration and secret interpolation remain the configuration
system. Runtime modules are scoped to `web`, `api`, `scheduler`, `realtime`,
`worker`, and `migrate`; browser-visible config remains limited to public
values. `DATABASE_URL` is never exposed to browser code.

Taskfile is the only supported command interface. It must expose focused
install, doctor, migration, development, test, build, and quality commands for
each runtime, plus an umbrella local-development command. Docker Compose runs
PostgreSQL, migrations, API, web, and optional jobs/realtime profiles with the
same runtime boundaries.

## Failure Handling

- Elysia maps validation, known usecase, not-found, and unexpected failures to
  the standard failure envelope without exposing sensitive details.
- The proxy preserves API response semantics and only produces a gateway error
  for proxy-level failures.
- River owns retry, backoff, and failure state. All Go job handlers must be
  idempotent.
- Realtime publication occurs post-commit so aborted transactions cannot produce
  false events. Publication failure is logged and observable; clients can still
  obtain authoritative data through HTTP.

## Verification

- Test Elysia routes and TypeScript usecases for validation, envelopes,
  transactions, and transactional enqueue behavior.
- Test the TanStack Start proxy for forwarded method/path/status/body and API
  unavailability behavior.
- Test River TypeScript job contract validation and scheduler enqueue/uniqueness
  behavior.
- Test Go River handlers for decoding, idempotency, retry-safe behavior, and
  registration.
- Test migration orchestration against an empty PostgreSQL instance.
- Test realtime publisher authentication, ticket validation, room authorization,
  and reconnect-driven HTTP resynchronization.
- Before integration, run focused tests followed by `task quality` and
  `task build`.
