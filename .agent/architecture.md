# Architecture

TanStack Start is the public web runtime and embeds the Elysia app through
`apps/web/src/routes/api.$.ts`. Elysia is the business HTTP boundary. Prisma is
owned by `packages/database`; River tables share PostgreSQL with Prisma and are
migrated by `apps/migrate` after Prisma deploy migrations. Bun/TypeScript
produces jobs, Go/River consumes them, and Elysia relays worker events to the
Socket.IO runtime.
