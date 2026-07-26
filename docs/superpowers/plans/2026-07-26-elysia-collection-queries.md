# Elysia Collection Queries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a reusable Elysia-native, OpenAPI-documented cursor collection-query contract for versioned public API routes.

**Architecture:** `apps/api/src/collection-query` owns a storage-agnostic query definition, cursor codec, response builder, and Elysia macro plugin. A route opts in with `collection: definition`; the plugin validates the exact public query parameters, resolves a typed `collection` context value, and exposes no database model or Prisma input. Query implementations remain endpoint-owned and map the parsed contract to their own read backend.

**Tech Stack:** Bun, TypeScript, Elysia 1.4, TypeBox through `elysia.t`, `@elysia/openapi`, Bun test.

## Global Constraints

- Public collection routes remain under `/api/vN`; `/health` and `/api/internal/*` are outside this contract.
- Use `page[size]`, `page[after]`, and `page[before]`; `after` and `before` are mutually exclusive.
- Cursor pagination is the only generic mode. Do not add offset or page-number pagination in this work.
- All public parameter and OpenAPI descriptions are English.
- Filters, operators, sorts, and search are endpoint whitelists. Never expose Prisma `where`, `orderBy`, field names, or relation traversal directly.
- Mutations continue to call application usecases. Collection query helpers do not create a TypeScript DI container or a runtime dependency graph.
- Links are relative, canonical, preserve the active collection query, and use `self`, `next`, and `prev`.
- Cursor tokens include a version, ordering position, and normalized-query fingerprint. Malformed or incompatible tokens produce the existing `422` envelope without exposing internals.
- No baseline product route or product model is added solely to demonstrate the abstraction.

## File Structure

```text
apps/api/src/
  collection-query/
    cursor.ts                 # versioned opaque cursor codec and fingerprinting
    definition.ts             # endpoint declarations, TypeBox query schema, typed parser
    response.ts               # paginated response schema, metadata, and relative links
    plugin.ts                 # named Elysia `collection` macro
    *.test.ts                 # unit and integration behavior tests
  app.ts                      # installs the collection-query plugin before public routes
  openapi.test.ts             # asserts generated parameter descriptions and schemas
.agent/api/README.md          # route-author guidance and examples
```

### Task 1: Define collection declarations and cursor invariants

**Files:**

- Create: `apps/api/src/collection-query/cursor.ts`
- Create: `apps/api/src/collection-query/cursor.test.ts`
- Create: `apps/api/src/collection-query/definition.ts`
- Create: `apps/api/src/collection-query/definition.test.ts`

**Interfaces:**

- Produces `defineCollection(config)`, `enumFilter(values, options)`, and `dateRangeFilter(options)`.
- Produces `CollectionDefinition`, whose `querySchema` is an Elysia TypeBox schema and whose `parse(query)` returns `CollectionQuery`.
- Produces `encodeCursor(payload)`, `decodeCursor(value)`, and `createQueryFingerprint(input)`.
- `CollectionQuery` contains `pagination: { type: "cursor"; size: number; after?: CursorPosition; before?: CursorPosition }`, a normalized `sort` array, declared `filters`, and optional `search`.

- [ ] **Step 1: Write a failing declaration/parser test**

Create `definition.test.ts` with a collection definition and assert that raw
validated query input is normalized into a storage-agnostic query. The desired
behavior is explicit defaults, an appended unique tie-breaker, parsed filters,
and optional search:

```ts
const orders = defineCollection({
	page: { defaultSize: 25, maxSize: 100 },
	sorts: {
		createdAt: { description: "Sort orders by creation time." },
		id: { description: "Sort orders by identifier." },
	},
	defaultSort: ["-createdAt"],
	tieBreaker: "id",
	filters: {
		status: enumFilter(["draft", "paid", "cancelled"], {
			description: "Return orders with the given lifecycle status.",
		}),
		createdAt: dateRangeFilter({
			description: "Limit orders by creation timestamp.",
		}),
	},
	search: { description: "Searches order reference and customer name." },
});

test("parses a declared cursor collection query", () => {
	const query = orders.parse({
		"page[size]": 10,
		sort: "-createdAt",
		"filter[status]": "paid",
		"filter[createdAt][gte]": "2026-01-01T00:00:00.000Z",
		q: "invoice",
	});

	expect(query).toEqual({
		pagination: { type: "cursor", size: 10 },
		sort: [
			{ field: "createdAt", direction: "desc" },
			{ field: "id", direction: "asc" },
		],
		filters: {
			status: "paid",
			createdAt: { gte: new Date("2026-01-01T00:00:00.000Z") },
		},
		search: "invoice",
	});
});
```

- [ ] **Step 2: Write failing invalid-query tests**

Add focused tests that call the parser/schema with the following conditions:

```ts
test("rejects page size above the declared maximum", () => {
	expect(() => orders.parse({ "page[size]": 101 })).toThrow();
});

test("rejects undeclared sort fields", () => {
	expect(() => orders.parse({ sort: "customerEmail" })).toThrow();
});

test("rejects both cursor directions", () => {
	expect(() => orders.parse({ "page[after]": "a", "page[before]": "b" })).toThrow();
});
```

Run: `rtk bun test apps/api/src/collection-query/definition.test.ts`

Expected: FAIL because the collection-query modules do not exist.

- [ ] **Step 3: Write a failing cursor-codec test**

Create `cursor.test.ts`. Assert a versioned encoded token round-trips and an
incompatible normalized query fails before its position is returned:

```ts
test("rejects a cursor from a different normalized collection query", () => {
	const cursor = encodeCursor({
		position: { createdAt: "2026-01-01T00:00:00.000Z", id: "ord_1" },
		fingerprint: createQueryFingerprint({ sort: ["-createdAt", "-id"], filters: { status: "paid" }, search: undefined }),
	});

	expect(() =>
		decodeCursor(cursor, createQueryFingerprint({ sort: ["-createdAt", "-id"], filters: { status: "draft" }, search: undefined })),
	).toThrow();
});
```

Run: `rtk bun test apps/api/src/collection-query/cursor.test.ts`

Expected: FAIL because the cursor codec does not exist.

- [ ] **Step 4: Implement the cursor codec**

In `cursor.ts`, define a literal version and a strict token shape:

```ts
export type CursorPosition = Record<string, string | number | boolean | null>;

type CursorPayload = {
	v: 1;
	position: CursorPosition;
	fingerprint: string;
};

export function encodeCursor(payload: Omit<CursorPayload, "v">): string;
export function decodeCursor(value: string, expectedFingerprint: string): CursorPosition;
export function createQueryFingerprint(input: { sort: readonly string[]; filters: Record<string, unknown>; search?: string }): string;
```

Canonicalize object keys before hashing so equal logical filters always yield
the same fingerprint. Encode JSON with base64url. Reject invalid base64url,
invalid JSON, an unknown version, missing fields, and a fingerprint mismatch
with a generic `Invalid collection cursor` error. Do not include a Prisma
identifier or a raw URL in the token contract.

- [ ] **Step 5: Implement declarations, schema generation, and parsing**

In `definition.ts`, implement the declaration types and factory. Build a
`t.Object` whose literal property names are the enabled parameters:

```ts
{
	"page[size]": t.Optional(t.Integer({ minimum: defaultSize, maximum: maxSize })),
	"page[after]": t.Optional(t.String()),
	"page[before]": t.Optional(t.String()),
	sort: t.Optional(t.String()),
	"filter[status]": t.Optional(t.Union([t.Literal("draft"), t.Literal("paid"), t.Literal("cancelled")])),
	"filter[createdAt][gte]": t.Optional(t.String({ format: "date-time" })),
	q: t.Optional(t.String()),
}
```

Use `minimum: 1` for `page[size]`; the default is applied in `parse`, not as
the schema minimum. Attach every declaration description and a concrete
example through TypeBox schema options. Split `sort` on commas, reject empty or
duplicate fields, validate each field against the definition, and append the
tie-breaker when absent. Parse declared date-range values as `Date` instances.
Decode `after` or `before` only after deriving the normalized sort/filter/search
fingerprint.

- [ ] **Step 6: Run focused tests and typecheck**

Run: `rtk bun test apps/api/src/collection-query/cursor.test.ts apps/api/src/collection-query/definition.test.ts && rtk bun --cwd apps/api run check-types`

Expected: PASS.

- [ ] **Step 7: Commit the invariant layer**

```bash
git add apps/api/src/collection-query/cursor.ts apps/api/src/collection-query/cursor.test.ts apps/api/src/collection-query/definition.ts apps/api/src/collection-query/definition.test.ts
git commit -m "feat(api): define collection query contract"
```

### Task 2: Build paginated envelopes and canonical navigation links

**Files:**

- Create: `apps/api/src/collection-query/response.ts`
- Create: `apps/api/src/collection-query/response.test.ts`

**Interfaces:**

- Consumes `CollectionDefinition` and `encodeCursor` from Task 1.
- Produces `collectionEnvelope(itemSchema)`, `createCollectionResponse(definition, page, requestUrl, requestId)`, and `CollectionPage<T>`.
- `CollectionPage<T>` is `{ items: T[]; hasNextPage: boolean; hasPreviousPage: boolean; startPosition?: CursorPosition; endPosition?: CursorPosition }`.

- [ ] **Step 1: Write the failing response/links test**

Create `response.test.ts` with a declared Orders collection. Assert that the
response emits the standard success field, page metadata, and relative links:

```ts
const result = createCollectionResponse(
	orders,
	{
		items: [{ id: "ord_1" }],
		hasNextPage: true,
		hasPreviousPage: false,
		startPosition: { createdAt: "2026-01-02T00:00:00.000Z", id: "ord_1" },
		endPosition: { createdAt: "2026-01-02T00:00:00.000Z", id: "ord_1" },
	},
	"http://localhost:4100/api/v1/orders?filter[status]=paid&sort=-createdAt&page[size]=10",
	"request-1",
);

expect(result.links).toEqual({
	self: "/api/v1/orders?page[size]=10&sort=-createdAt%2Cid&filter[status]=paid",
	next: expect.stringContaining("/api/v1/orders?page[size]=10&sort=-createdAt%2Cid&filter[status]=paid&page[after]="),
	prev: null,
});
expect(result.meta.page).toMatchObject({ size: 10, hasNextPage: true, hasPreviousPage: false });
```

- [ ] **Step 2: Write failing null-link and schema tests**

Add a test where both navigation booleans are false. It must return `next: null`
and `prev: null`, while `self` remains present. Assert
`collectionEnvelope(t.Object({ id: t.String() }))` accepts `data` as an array,
requires `meta.requestId`, and requires all three link keys.

Run: `rtk bun test apps/api/src/collection-query/response.test.ts`

Expected: FAIL because the response module does not exist.

- [ ] **Step 3: Implement schema and response creation**

Implement these schemas with Elysia `t`:

```ts
export function collectionEnvelope<T extends TSchema>(item: T) {
	return t.Object({
		success: t.Literal(true),
		data: t.Array(item),
		meta: t.Object({
			requestId: t.String(),
			page: t.Object({
				size: t.Integer({ minimum: 1 }),
				hasNextPage: t.Boolean(),
				hasPreviousPage: t.Boolean(),
				startCursor: t.Union([t.String(), t.Null()]),
				endCursor: t.Union([t.String(), t.Null()]),
			}),
		}),
		links: t.Object({
			self: t.String(),
			next: t.Union([t.String(), t.Null()]),
			prev: t.Union([t.String(), t.Null()]),
		}),
	});
}
```

Generate `self` from the parsed normalized query, not the original input order.
Generate `next` only from `endPosition` when `hasNextPage` is true and `prev`
only from `startPosition` when `hasPreviousPage` is true. Use `URL` and
`URLSearchParams`, then return `pathname + search`; never return an origin or
copy unrelated query keys.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `rtk bun test apps/api/src/collection-query/response.test.ts && rtk bun --cwd apps/api run check-types`

Expected: PASS.

- [ ] **Step 5: Commit the response contract**

```bash
git add apps/api/src/collection-query/response.ts apps/api/src/collection-query/response.test.ts
git commit -m "feat(api): add paginated collection envelopes"
```

### Task 3: Expose the Elysia collection macro and verify generated OpenAPI

**Files:**

- Create: `apps/api/src/collection-query/plugin.ts`
- Create: `apps/api/src/collection-query/plugin.test.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/openapi.test.ts`

**Interfaces:**

- Consumes `CollectionDefinition` from Task 1 and response schema factory from Task 2.
- Produces `collectionQueryPlugin`, a named Elysia plugin exposing the route option `collection: CollectionDefinition` and a typed `collection` context value.
- The plugin is installed before `createV1Routes()` in `createApp()`.

- [ ] **Step 1: Write the failing macro integration test**

Create `plugin.test.ts` with a standalone Elysia test application:

```ts
const app = new Elysia()
	.use(collectionQueryPlugin)
	.get("/orders", ({ collection }) => ({ size: collection.pagination.size, sort: collection.sort }), { collection: orders });

test("resolves validated collection input into the handler context", async () => {
	const response = await app.handle(new Request("http://localhost/orders?page[size]=10&sort=-createdAt"));
	expect(response.status).toBe(200);
	expect(await response.json()).toEqual({
		size: 10,
		sort: [
			{ field: "createdAt", direction: "desc" },
			{ field: "id", direction: "asc" },
		],
	});
});
```

Add a second test that requests both cursor directions and asserts Elysia sends
the project-standard `422` validation response.

- [ ] **Step 2: Run the macro test to verify it fails**

Run: `rtk bun test apps/api/src/collection-query/plugin.test.ts`

Expected: FAIL because `collectionQueryPlugin` does not exist and the custom
route option is not known to Elysia.

- [ ] **Step 3: Implement the named macro plugin**

Create the plugin with a named macro so its schema and resolved context remain
type-inferred:

```ts
export const collectionQueryPlugin = new Elysia({ name: "collection-query" })
	.macro("collection", (definition: CollectionDefinition) => ({
		query: definition.querySchema,
		resolve({ query }) {
			return { collection: definition.parse(query) };
		},
	}))
	.as("global");
```

Do not add a global `query` guard: only routes explicitly using
`collection: definition` receive this validation and context. Use a named macro
instead of an object macro so Elysia preserves lifecycle inference for
`resolve`.

- [ ] **Step 4: Write a failing OpenAPI regression test**

Extend `openapi.test.ts` by building an Elysia fixture that uses
`openapiPlugin`, `collectionQueryPlugin`, and a route with the Orders
definition. Assert the operation's parameters include exactly the declared
collection capabilities and their English documentation:

```ts
expect(parameters).toEqual(
	expect.arrayContaining([
		expect.objectContaining({ name: "page[size]", in: "query", description: "Maximum number of items to return." }),
		expect.objectContaining({
			name: "page[after]",
			in: "query",
			description: "Opaque cursor that continues forward from a previous response.",
		}),
		expect.objectContaining({ name: "filter[status]", in: "query", description: "Return orders with the given lifecycle status." }),
		expect.objectContaining({ name: "q", in: "query", description: "Searches order reference and customer name." }),
	]),
);
expect(parameters).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: "filter[customerEmail]" })]));
```

- [ ] **Step 5: Install the plugin and verify the public API still builds**

Insert `.use(collectionQueryPlugin)` in `createApp()` before the public route
collection. Import it from its dedicated module; do not move parsing code into
`app.ts`. Run the macro and OpenAPI tests:

`rtk bun test apps/api/src/collection-query/plugin.test.ts apps/api/src/openapi.test.ts && rtk bun --cwd apps/api run check-types && rtk bun --cwd apps/api run build`

Expected: PASS.

- [ ] **Step 6: Commit Elysia integration**

```bash
git add apps/api/src/collection-query/plugin.ts apps/api/src/collection-query/plugin.test.ts apps/api/src/app.ts apps/api/src/openapi.test.ts
git commit -m "feat(api): add Elysia collection query macro"
```

### Task 4: Document route-author usage and enforce the finished contract

**Files:**

- Modify: `.agent/api/README.md`
- Modify: `docs/discussion/2026-07-26-elysia-backend-architecture.md`

**Interfaces:**

- Consumes the public `defineCollection`, filter builders, `collectionQueryPlugin`, and `collectionEnvelope` contract from Tasks 1–3.
- Produces route-author guidance that keeps collection reads flexible while preserving the public query boundary.

- [ ] **Step 1: Write a failing documentation contract test**

Add an assertion to the most relevant existing documentation/architecture test
suite, or create `apps/api/src/collection-query/documentation.test.ts` if no
such suite can express the contract. The test must read `.agent/api/README.md`
and assert it contains each required public spelling:

```ts
expect(guidance).toContain("page[size]");
expect(guidance).toContain("page[after]");
expect(guidance).toContain("filter[field]");
expect(guidance).toContain("sort=-createdAt,id");
expect(guidance).toContain("whitelist");
```

Run: `rtk bun test apps/api/src/collection-query/documentation.test.ts`

Expected: FAIL because route-author guidance does not yet contain the contract.

- [ ] **Step 2: Add concise route-author guidance**

Document all of the following in `.agent/api/README.md`:

- use `collection: defineCollection(...)` only on collection `GET` routes;
- define only indexed, authorized sort/filter/search capabilities;
- provide English descriptions for every declared capability;
- pass the typed parsed collection value to an endpoint-owned query function;
- map it to Prisma/SQL there, never in the generic collection helper;
- use `collectionEnvelope(itemSchema)` and relative `self`/`next`/`prev` links;
- keep mutations on application usecases.

Update the architecture discussion with the finalized choice of the Elysia macro,
JSON:API-style cursor parameters, and relative navigation links.

- [ ] **Step 3: Run the documentation test and complete repository verification**

Run:

`rtk bun test apps/api/src/collection-query/documentation.test.ts && rtk task format:check && rtk task quality && rtk task build`

Expected: PASS. If Compose migration fails again, preserve the test/build result,
run `rtk task compose:down`, and report the migration failure without claiming a
Compose smoke pass.

- [ ] **Step 4: Commit documentation and verification test**

```bash
git add .agent/api/README.md docs/discussion/2026-07-26-elysia-backend-architecture.md apps/api/src/collection-query/documentation.test.ts
git commit -m "docs(api): guide collection query routes"
```

## Plan Self-Review

### Spec coverage

- Cursor parameter names, exclusivity, default cursor-only mode, whitelisted
  sorting/filtering/search, and English descriptions are implemented in Task 1.
- Versioned opaque cursor position and normalized-query fingerprint behavior is
  implemented and tested in Task 1.
- Existing-envelope-compatible data, pagination metadata, canonical relative
  navigation, and the no-total/no-last baseline are implemented in Task 2.
- Elysia named macro, TypeBox/OpenAPI single-source behavior, and OpenAPI
  descriptions/examples are implemented and tested in Task 3.
- Route-author boundaries and complete formatting/quality/build verification are
  covered in Task 4.

### Placeholder scan

The plan contains no implementation placeholders. Each task identifies concrete
files, produced interfaces, expected failing tests, implementation behavior,
verification commands, and commit message.

### Type consistency

`CollectionDefinition`, `CollectionQuery`, `CursorPosition`,
`collectionEnvelope`, `createCollectionResponse`, and
`collectionQueryPlugin` have consistent names and ownership across all tasks.
