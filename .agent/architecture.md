# Architecture

TanStack Start is the public web runtime and embeds the Elysia app through
`apps/web/src/app/api/$.ts`. Elysia is the business HTTP boundary, with public
routes grouped under `/api/vN`. Prisma is owned by `packages/database`; River
tables share PostgreSQL with Prisma and are migrated by `apps/migrate` after
Prisma deploy migrations. Bun/TypeScript produces jobs, Go/River consumes them,
and Elysia relays worker events to the Socket.IO runtime.

The API definition is independent from its host: it may remain embedded in a
web process or later be hosted by a standalone HTTP process. TypeScript runtime
resources are singletons per process and are not assembled through a DI
container. Mutation routes call `@repo/application`; query routes may use
consumer-specific read adapters.
