# Backend TypeScript

## Runtime ownership

Each API, scheduler, and realtime process owns one instance of its runtime
resources: validated config, logger, Prisma client, queue client, and external
provider clients as applicable. A singleton is once per process, not once for
the monorepo or across containers. Put these declarations in the process
runtime module; keep the server entrypoint responsible only for listening and
shutdown.

TypeScript runtimes do not use a DI container. Avoid production factories that
accumulate repository/client/callback parameters. Pure factories such as
`createRoutes(1)` remain appropriate because they construct structure, not a
runtime dependency graph.

## HTTP boundaries

Elysia is the HTTP transport boundary. Public routes live under `/api/vN` and
are composed as version collections. Health is operational (`/health`), while
internal service gateways remain explicitly internal and unversioned. The web
adapter embeds the Elysia application through `app.fetch`; it does not proxy
over the network or duplicate handlers.

Platform behavior belongs in named Elysia plugins: request context/logging,
blocked-path protection, documentation authorization, and the central error
envelope. Route modules own feature transport only. Public routes declare
request and response schemas so Eden and OpenAPI remain accurate.

## Mutation and query

Every TypeScript mutation follows:

```text
HTTP validation/auth → input mapping → @repo/application command
→ transaction/database → response mapping
```

Do not import Prisma or perform `.create`, `.update`, `.upsert`, `.delete`, or
similar writes from HTTP route modules. Query code is flexible: a route may
use a feature-specific read adapter or projection when that best serves its
consumer. Query flexibility does not relax authorization or database-client
ownership rules.

## Verification

Run `bun run check:architecture` to check source boundaries, `task format` to
format TypeScript/Markdown and Go, and `task format:check` to verify both
without modifying files. API tests exercise the exported Elysia application
with `app.fetch` or `app.handle`.
