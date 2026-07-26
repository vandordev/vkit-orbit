# Elysia Handler Documentation Design

## Purpose

Make every Elysia handler self-explanatory in generated OpenAPI/Scalar
documentation. A reader must be able to understand an operation, every input,
and every documented response without reading implementation code.

## Scope

The standard applies to every Elysia handler in `apps/api`, including health
and hidden internal handlers. Public operations are validated through the
generated OpenAPI document. Hidden operations remain excluded from public
OpenAPI but must use the same source-level documentation helper.

This work does not create product routes, change API versioning, alter handler
business behavior, or introduce an API-description language outside TypeScript
and Elysia schemas.

## Operation metadata

Every handler declares metadata through a shared `apiOperation` helper:

```ts
detail: apiOperation({
	summary: "Get API status",
	description: "Returns the current status of the versioned public API.",
	tags: ["System"],
});
```

The helper requires non-empty English `summary`, `description`, and `tags`.

- `summary` is one concise sentence naming the endpoint action.
- `description` explains behavior, relevant policy, effects, pagination/query
  semantics when applicable, and meaningful status/error conditions.
- `tags` place the operation in an existing or deliberately declared OpenAPI
  group.

`operationId` is not written manually. `@elysia/openapi` already generates a
stable identifier from the HTTP method and path, such as
`getApiV1Orders` or `postApiInternalWorkerEvents`. The contract guard verifies
that the generated value exists and is unique.

Hidden operations add `hide: true` through the same helper:

```ts
detail: apiOperation({
	summary: "Publish worker event",
	description: "Authenticates a worker completion event and forwards it to the private realtime publisher.",
	tags: ["Internal"],
	hide: true,
});
```

## Input schemas

Every path parameter, query parameter, header, cookie, and request-body field
has an English `description` and at least one `examples` value in its TypeBox
schema.

Collection query helpers continue generating their common descriptions and
examples. Endpoint-defined collection filters, sorting fields, and search
descriptions remain mandatory. The guard verifies the resulting OpenAPI
parameter schemas rather than duplicating collection rules.

Request payloads document every object property recursively. A property may be
exempt only when it is an intentionally unconstrained transport value such as
the worker gateway's `t.Any()` body, and that exemption must be explicitly
documented in the route description because authentication intentionally occurs
before body validation.

## Response schemas and examples

Every documented response status has:

- a non-empty response description;
- a response schema whose object properties are recursively described; and
- a concrete JSON example appropriate to that status.

Schema factories such as `successEnvelope`, `failureEnvelope`, and
`collectionEnvelope` accept documentation options so route authors can provide
operation-specific response descriptions and examples without hand-copying the
envelope shape. Common envelope fields (`success`, `data`, `error`, `message`,
`details`, `requestId`, pagination metadata, and links) define their own field
descriptions.

The API may declare only statuses it can return. The documentation standard does
not require every operation to expose every possible HTTP status. If a status is
declared, however, its description and example are mandatory.

## Enforcement

Two checks enforce the standard.

1. A source-level architecture check requires every Elysia route definition in
   `apps/api/src` to use `apiOperation(...)`, including hidden routes.
2. An OpenAPI contract test obtains the generated document from the real API
   application and validates every visible operation:
   - unique, non-empty `operationId`, `summary`, `description`, and tags;
   - parameter schemas with descriptions and examples;
   - request-body schema properties with descriptions and examples; and
   - response descriptions, examples, and recursively documented object
     properties.

The checker reports the HTTP method, path, and missing metadata so a route
author can fix the exact operation. It allows schema constructs that cannot be
described field-by-field, including `t.Any()`, only when explicitly registered
as a narrow route-local exemption.

## Route-author guidance

`.agent/api/README.md` documents the mandatory route metadata and schema
documentation rules with concise examples for operation metadata, parameters,
request payloads, response schemas, and response examples. It states that
documentation is part of the handler contract and that the repository quality
gate rejects undocumented operations.

## Verification

Tests add one intentionally incomplete fixture operation and assert that the
contract checker reports its missing metadata. Tests also assert that the real
API document passes once health, status, and worker-event routes are migrated.

`task quality` and `task build` remain required before handoff. The architecture
check becomes part of `task quality`, so undocumented new handlers fail the
normal repository gate.
