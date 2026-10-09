# Architecture

TanStack Start serves the dashboard and same-origin tRPC. `apps/api` is the
standalone Elysia business HTTP boundary with public routes under `/v1`.
Prisma is owned by `packages/db`; PostgreSQL is source of truth and
BullMQ/Redis provides delivery and scheduling. The TypeScript worker relays
events to the Socket.IO runtime.

The API is standalone and is not a web proxy. TypeScript runtime resources are
singletons per process and are not assembled through a DI container. Mutation
routes call `@repo/application`; query routes use workspace-scoped adapters.
Browser code uses tRPC only and never imports server credentials.

Runtime configuration is one strict YAML document with isolated typed Zod 4
selectors. Config/Prisma/logger resources are lazy until bootstrap or execution;
no secret validation during build imports. `config.public` is database/session
independent; authenticated middleware resolves sessions lazily before unchanged
workspace/permission gates. Public schema is the only client-safe config export.
