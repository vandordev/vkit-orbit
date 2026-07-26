# Elysia Collection Query Design

## Purpose

Define a reusable, documented contract for public collection endpoints in
`apps/api`. The contract covers cursor pagination, filtering, sorting, optional
free-text search, and paginated response navigation without exposing storage
implementation details.

This is an API-boundary concern. It complements the existing command/usecase
rule: mutations continue to call TypeScript application usecases; read queries
may use a query implementation appropriate to the endpoint.

## Scope

This design applies to versioned public collection routes such as
`GET /api/v1/orders`. It supplies Elysia validation, OpenAPI documentation,
typed parsed input, and response envelope helpers.

It does not introduce a generic CRUD API, automatic Prisma filtering, offset
pagination by default, a new HTTP server, or a replacement for endpoint-level
authorization.

## HTTP contract

Collection endpoints opt in to the following query parameter families:

| Parameter                 | Meaning                                                                           |
| ------------------------- | --------------------------------------------------------------------------------- |
| `page[size]`              | Maximum number of returned items. Each collection declares a default and maximum. |
| `page[after]`             | Opaque cursor for the next page.                                                  |
| `page[before]`            | Opaque cursor for the previous page.                                              |
| `sort`                    | Comma-separated sortable fields; a `-` prefix means descending order.             |
| `filter[field]`           | An endpoint-defined equality filter.                                              |
| `filter[field][operator]` | An endpoint-defined operator filter, such as `gte`, `lte`, or `in`.               |
| `q`                       | Optional endpoint-defined free-text search.                                       |

The pagination spelling follows the JSON:API cursor-pagination convention:
`page[size]`, `page[after]`, and `page[before]`. Public API descriptions are
written in English.

Every endpoint explicitly whitelists supported sort fields, filters, operators,
and search behavior. A client cannot name a Prisma field, relation, or operator
that the endpoint did not declare.

`page[after]` and `page[before]` are mutually exclusive. Cursor pagination is
the default. An endpoint that genuinely needs numbered-page navigation may
define an offset contract separately; it must not mix offset and cursor modes in
one request.

## Route declaration and Elysia integration

`apps/api` will provide an internal Elysia collection-query plugin. It uses
TypeBox/Elysia schemas as the single source of truth for runtime validation,
TypeScript inference, and generated OpenAPI documentation.

The plugin exposes a named `collection` macro. A route declares its query
capability once:

```ts
const ordersCollection = defineCollection({
	page: { defaultSize: 25, maxSize: 100 },
	sorts: {
		createdAt: { description: "Sort orders by creation time." },
		total: { description: "Sort orders by total monetary amount." },
	},
	defaultSort: ["-createdAt", "-id"],
	filters: {
		status: enumFilter(["draft", "paid", "cancelled"], {
			description: "Return orders with the given lifecycle status.",
		}),
		createdAt: dateRangeFilter({
			description: "Limit orders by creation timestamp.",
		}),
	},
	search: {
		description: "Searches order reference and customer name.",
	},
});

createRoutes(1).get("/orders", handler, {
	collection: ordersCollection,
});
```

The macro attaches the generated `query` schema to the route and resolves a
typed `collection` value in the Elysia context. The handler never parses raw
query strings itself.

The plugin also registers reusable Elysia models for pagination metadata,
navigation links, and collection envelopes. Per-resource item schemas remain
owned by their route or feature module.

## Parsed query contract

The macro turns validated URL input into a storage-agnostic `CollectionQuery`:

```ts
{
	pagination: {
		type: "cursor",
		size: 25,
		after?: CursorPosition,
		before?: CursorPosition,
	},
	filters: { /* endpoint-declared values only */ },
	sort: [
		{ field: "createdAt", direction: "desc" },
		{ field: "id", direction: "desc" },
	],
	search?: "invoice",
}
```

Each collection declares a deterministic default sort. The collection builder
appends a unique tie-breaker, normally `id`, when callers do not provide one.
This produces a total ordering required for correct keyset pagination.

Cursor values are opaque to clients. A cursor carries the last item's ordering
position, direction, and a fingerprint of the normalized sort/filter/search
contract. A cursor used with a different collection query is rejected with the
normal validation envelope rather than silently producing ambiguous results.

The downstream query implementation maps `CollectionQuery` to Prisma, SQL, or
another read backend. It owns authorization and any resource-specific policy.
It fetches `size + 1` rows to determine whether a next page exists without an
automatic `count()` query.

## Response envelope and navigation

Every paginated response uses the existing success envelope and adds pagination
metadata plus relative navigation links:

```json
{
	"success": true,
	"data": [],
	"meta": {
		"requestId": "...",
		"page": {
			"size": 25,
			"hasNextPage": true,
			"hasPreviousPage": false,
			"startCursor": "...",
			"endCursor": "..."
		}
	},
	"links": {
		"self": "/api/v1/orders?page[size]=25&sort=-createdAt%2Cid",
		"next": "/api/v1/orders?page[size]=25&sort=-createdAt%2Cid&page[after]=...",
		"prev": null
	}
}
```

`self` is always present and uses normalized query parameters. `next` and
`prev` are present with `null` when unavailable. They preserve page size, sort,
filters, and search exactly; only the cursor changes. Links are relative so the
same API remains valid when embedded in `web` or hosted by a future standalone
HTTP server.

The baseline does not emit `total`, `first`, or `last`. A resource may opt in to
`total` only when its UI need justifies the cost of counting. Cursor pagination
does not require a `last` link.

## OpenAPI documentation

The generated OpenAPI operation documents each enabled parameter independently.
The collection builder supplies English descriptions for the common pagination
and sorting parameters. Each resource supplies English descriptions, examples,
types, and enum values for its own filters and search semantics.

For example, the Orders operation documents `filter[status]` as an enum and
`filter[createdAt][gte]` as a timestamp. This is preferable to a generic
`filter` object: generated clients and Scalar can show exactly what the endpoint
supports, and nested query-object serialization is not left to client-specific
interpretation.

## Errors and verification

Malformed parameters, a size outside the collection limit, unknown sort/filter
fields, conflicting cursor directions, and malformed or incompatible cursors
return the standard `422` failure envelope. Error responses must not reveal
cursor internals or storage details.

Implementation tests must cover:

- query schema validation and parsed typed values;
- default and maximum page size;
- supported and unsupported sorts, filters, and operators;
- cursor direction and cursor/query incompatibility;
- stable tie-breaker behavior;
- response page metadata and relative `self`, `next`, and `prev` links;
- generated OpenAPI parameter names, descriptions, examples, and response
  schemas.
