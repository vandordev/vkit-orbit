# TanStack App Routing Design

## Goal

Move the web route source to `apps/web/src/app` and establish a documented,
directory-first TanStack Start routing convention. The convention should feel
easy to scan like an app-directory project while retaining TanStack Router's
native file tokens and the existing embedded Elysia boundary.

## Constraints

- TanStack Start remains the only public HTTP server.
- Elysia remains the only business HTTP boundary under `/api/*`; `/health` is
  also handled by Elysia.
- The web adapter calls `app.fetch(request)` directly. It does not proxy over
  the network, transform Elysia responses, or implement business endpoints.
- `packages/database` remains the only Prisma owner. Browser code receives no
  server credentials.
- `src/routeTree.gen.ts` remains generated and must never be edited manually.
- The project uses native TanStack routing tokens rather than custom
  `layout.tsx` or `page.tsx` tokens.

## Route Source and Layout

Configure the TanStack Start Vite plugin with
`routesDirectory: "./src/app"`. Keep the generated route tree at
`src/routeTree.gen.ts`.

The canonical starting structure is:

```text
apps/web/src/app/
├── __root.tsx
├── _public/
│   ├── route.tsx
│   ├── index.tsx
│   └── -components/
│       ├── orbit-hero.tsx
│       ├── architecture-map.tsx
│       └── public-header.tsx
├── api/
│   └── $.ts
├── health/
│   └── index.ts
├── dashboard/
│   ├── route.tsx
│   ├── index.tsx
│   └── settings/
│       └── index.tsx
└── users/
    ├── route.tsx
    ├── index.tsx
    └── $userId/
        └── index.tsx
```

`__root.tsx` owns the document shell, global providers, `<HeadContent />`,
`<Scripts />`, global error UI, and global not-found UI. `index.tsx` is the
index route for its directory. A `route.tsx` defines a layout only when the
directory needs a shared component, loader, guard, or route-level policy; it
renders an `<Outlet />`.

Dynamic segments use `$name`; splats use a final `$.ts` or `$.tsx`. A
pathless layout uses an `_name` directory and `route.tsx`, such as `_public`
or a future `_authenticated`. Its name does not appear in the URL, but its
component and route options wrap its children.

## Default Public Boilerplate Landing Page

`_public/index.tsx` is the `/` route and presents a domain-neutral **Vkit
Orbit** landing page. It is an orientation page for a new boilerplate consumer,
not a product feature, product dashboard, authentication flow, or sample
domain. It may be replaced when an adopting product starts its own UI.

The page uses the existing Tailwind and shadcn/ui baseline for controls and
accessible interactions. Its visual language is a dark, restrained solar
system: a central Vkit Orbit mark, orbiting nodes representing the actual
runtime boundaries, and clear typography explaining TanStack Start, embedded
Elysia, Prisma, River, the Go worker, and optional realtime. The architecture
section must describe the real runtime topology; the visual must not imply a
business API proxy or a second default HTTP server.

CSS and lightweight SVG provide the static orbital composition. Framer Motion
is an allowed dependency for progressive entrance, hover, and slow orbital
motion. All motion honors `prefers-reduced-motion`, has a static equivalent,
and must not be required to read content or activate calls to action. Route
components use `-components/` for the visual sections, keeping the route file
focused on route configuration and composition.

The landing route uses the metadata helper with the `Vkit Orbit` title and a
description of the domain-neutral TanStack/Elysia/River boilerplate.

## File Naming and Colocation

Use TanStack's native reserved names:

- `__root.tsx`: required root route.
- `index.tsx`: exact index route.
- `route.tsx`: directory layout route.
- `$name`: dynamic URL segment; `$`: splat segment.
- `_name`: pathless layout.
- `(name)`: organization-only route group with no URL or component-tree
  effect.
- `-name`: ignored by route generation.

Route-local non-route code must use the `-` prefix. Examples include
`-components/`, `-queries/`, `-schemas/`, and `-form-user.tsx`. Do not use
`_components`: `_` has TanStack pathless-layout semantics and is not an ignore
prefix. Existing `*.test.*` route files remain ignored through the Vite route
plugin configuration.

## Elysia Transport Boundary

`app/api/$.ts` registers every supported HTTP method and delegates directly to
`app.fetch(request)`. `app/health/index.ts` delegates its GET request the same
way. These routes are server adapters only: they have no UI component and do
not configure `errorComponent`, `pendingComponent`, or `notFoundComponent`.

Consequently, Elysia owns API validation, failure envelopes, unexpected-error
mapping, response status, and response body. TanStack UI error pages must
never replace an Elysia response for `/api/*` or `/health`.

## UI Data, Navigation, and Failure Policy

UI routes access business data through the existing typed Eden client. Server
loaders use the embedded app client; browser components use the same-origin
`/api/*` client. No route imports Prisma, database configuration, or business
usecases. Route loaders and TanStack Query must share query-option functions
when a feature needs cache hydration or prefetching, so a navigation does not
make avoidable duplicate requests.

Every UI search parameter is parsed by `validateSearch` with Zod. Internal
navigation uses typed TanStack `<Link>` or `navigate`, not raw same-origin
anchors. A future authenticated area uses `_authenticated/route.tsx` and
`beforeLoad` rather than repeating authorization checks in pages.

UI routes use the following failure taxonomy:

- `errorComponent`: thrown loader, query, or component errors intended for UI
  handling.
- `notFound()` and `notFoundComponent`: missing UI resources and unmatched UI
  paths.
- `pendingComponent`: loader/suspense pending state after an intentional
  `pendingMs` threshold.
- Elysia adapters: unchanged Elysia `Response`, including failures.

Shared error, pending, and not-found components are colocated in ignored
`-`-prefixed files or directories and wired explicitly through route options;
`error.tsx` and `loading.tsx` are not magic file names.

`app/-components/global-error.tsx` provides the default root
`errorComponent`. It follows the Vkit Orbit visual language without treating
an error state as product content: a restrained disrupted-orbit visual, an
accessible status heading, an explanation in safe user-facing language, and
two actions. **Try again** invokes the TanStack `reset` callback. **Back to
home** uses typed TanStack navigation to `/`. The component must work with
motion disabled, preserve visible keyboard focus, and never reveal a raw error
message, stack trace, request payload, credential, or implementation detail in
production. It only handles TanStack UI errors; Elysia adapter responses remain
unchanged.

The project installs the default loading primitive with:

```text
bunx --bun shadcn@latest add @loading-ui/symmetric-wave
```

Use the generated Symmetric Wave component for the root `pendingComponent` and
for any route-local pending UI. A local wrapper may supply semantic loading
copy or layout spacing, but must not replace the loading indicator with a
different bespoke animation. This keeps loading feedback consistent while
allowing a layout such as `dashboard/route.tsx` to choose its own pending
boundary and threshold.

## Metadata

Add `apps/web/src/lib/metadata.ts` as a typed `head`-object helper. It accepts
route metadata such as title, description, canonical path, and optional Open
Graph values, applies the application brand consistently, and returns a value
directly compatible with `head: () => ...`.

The root route supplies document-level defaults. Layout and leaf UI routes use
`head` to override or extend metadata; dynamic pages may derive input from
`loaderData`. TanStack's nested head merging and deduplication chooses the
most-specific title/meta values. Elysia adapters do not use the metadata
helper.

## Documentation and Verification

Create web routing documentation that explains this structure and all policy
above, including source ownership, reserved tokens, colocation, transport
boundaries, Eden data access, search-param validation, navigation, auth
extension, error taxonomy, metadata, and generated files.

Tests cover:

- generated routing with `src/app` as the source;
- the pathless `_public` index route at `/` and its Vkit Orbit metadata;
- unchanged `/api/*` method delegation and Elysia status/body responses;
- unchanged `/health` response;
- metadata helper output and root/global UI route configuration;
- the Symmetric Wave component is the configured default pending UI;
- global error UI invokes the provided reset callback and keeps Elysia adapter
  responses outside its boundary;
- representative UI route behavior for typed search validation, pending/error
  boundaries, and not-found handling where testable without a product domain.

Focused tests run before each implementation step. Completion requires focused
tests, `rtk task quality`, `rtk task build`, and the repository's Compose
smoke checks.
