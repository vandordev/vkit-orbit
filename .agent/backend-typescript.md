# Backend TypeScript

## Runtime ownership

Each API, scheduler, and realtime process owns one instance of its runtime
resources: validated config, logger, Prisma client, queue client, and external
provider clients as applicable. A singleton is once per process, not once for
the monorepo or across containers. Put these declarations in the process
runtime module with lazy getters; keep the entrypoint responsible for config
resolution before resources/listening and shutdown. Imports must not resolve
secret-bearing config or construct Prisma. Use `@repo/config/server` typed
runtime subsets from the sole YAML, not feature environment reads.

TypeScript runtimes do not use a DI container. Avoid production factories that
accumulate repository/client/callback parameters. Pure factories such as
`createRoutes(1)` remain appropriate because they construct structure, not a
runtime dependency graph.

## HTTP boundaries

Elysia is the standalone HTTP transport boundary. Public routes live under `/v1`
and are composed as version collections. Health is operational, while internal
service gateways remain internal and unversioned. Web hosts same-origin tRPC,
not embedded Elysia or a network proxy. `createApp()` constructs the API at bootstrap.

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

Follow `.agent/verification.md`: source/guard review and fresh native typecheck
only for system work. Preserve fixture sources using `createApp().fetch/handle`,
but do not execute tests, builds, lint/full gates, or backend services.
