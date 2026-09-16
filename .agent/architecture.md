# Architecture

TanStack Start serves the dashboard and same-origin tRPC. `apps/api` is the
standalone Elysia business HTTP boundary with public routes under `/v1`.
Prisma is owned by `packages/database`; PostgreSQL is source of truth and
BullMQ/Redis provides delivery and scheduling. The TypeScript worker relays
events to the Socket.IO runtime.

The API is standalone and is not a web proxy. TypeScript runtime resources are
singletons per process and are not assembled through a DI container. Mutation
routes call `@repo/application`; query routes use workspace-scoped adapters.
Browser code uses tRPC only and never imports server credentials.
