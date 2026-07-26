# API

`apps/api/src/app.ts` is the Elysia composition root. It mounts named platform
plugins, operational health routes, internal routes, and public version
collections; it must not contain domain/provider wiring.

Public API routes are grouped under `/api/vN`. `createRoutes(version: number)`
creates the version group, and v1/v2 coexist independently. A new version does
not automatically deprecate an older one. `/api/docs` and
`/api/openapi.json` are one aggregate documentation surface for all mounted
public versions.

The web adapter calls `app.fetch` directly; it is not a network proxy. The
standalone Bun entrypoint is optional and is not part of default Compose.

Runtime collaborators are module singletons created once per JavaScript
process. Do not add a production DI container or an expanding
`AppDependencies` object. Routes validate transport input, enforce policy, and
map to a command in `@repo/application` for mutations. They must not import
Prisma or perform database writes. Query routes may use feature-specific read
adapters and projections.

`POST /api/internal/worker-events` is an internal, unversioned gateway. It
authenticates `x-worker-notification-key`, validates the shared event contract,
and maps publisher outages to retryable 503. It is not part of public OpenAPI.
