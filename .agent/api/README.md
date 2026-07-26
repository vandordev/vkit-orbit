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

## Collection queries

Versioned `GET` collection routes use `collection: defineCollection(...)` on
the route returned by `createRoutes(version)`. The collection macro validates
the route query, resolves a typed `collection` value for the handler, and
generates the matching OpenAPI parameters.

The public cursor contract is:

```text
page[size]                    Requested page size
page[after] / page[before]    Forward or backward opaque cursor; never both
sort=-createdAt,id            Comma-separated sort fields; `-` is descending
filter[field]                 Declared equality filter
filter[field][operator]       Declared range/operator filter
q                             Declared resource-specific search
```

Every collection must whitelist its allowed sort fields, filters, operators,
and search behavior. Define an English description and useful example for every
declared capability; it is emitted into the generated OpenAPI schema. Do not
accept Prisma `where`, `orderBy`, relation paths, or arbitrary field names from
the request.

Handlers receive the parsed `collection` contract and pass it to an
endpoint-owned read query. That query owns authorization scope and maps the
contract to Prisma, SQL, or another read backend. The generic collection helper
does not import Prisma and does not choose database indexes.

Return list results through `collectionEnvelope(itemSchema)` and
`createCollectionResponse(...)`. The response has canonical relative `self`,
`next`, and `prev` links, plus `meta.page`; it does not include `total`,
`first`, or `last` by default. Malformed collection input uses the standard
`422` validation failure envelope.

`POST /api/internal/worker-events` is an internal, unversioned gateway. It
authenticates `x-worker-notification-key`, validates the shared event contract,
and maps publisher outages to retryable 503. It is not part of public OpenAPI.
