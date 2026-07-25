# TanStack app routing

## Route tree

The TanStack Start Vite plugin reads `apps/web/src/app`, while the generated
tree remains `apps/web/src/routeTree.gen.ts`:

```text
src/app/
├── __root.tsx
├── _public/route.tsx
├── _public/index.tsx
├── _public/-components/
├── -components/                 # global pending/error/not-found UI
├── api/$.ts
└── health/index.ts
```

`__root.tsx` owns the document shell, providers, head, scripts, and global
route boundaries. The `_public` layout is pathless, so its index is `/`.

## Native naming tokens

| Token | Meaning |
| --- | --- |
| `__root.tsx` | Required root route |
| `index.tsx` | Directory index route |
| `route.tsx` | Directory layout route, usually rendering `<Outlet />` |
| `$userId` | Dynamic URL segment |
| `$` | Final splat segment |
| `_public` | Pathless layout; the name is absent from the URL |
| `(admin)` | Organization-only route group |
| `-components` | Ignored colocated code; never a route |

Use `route.tsx` only when a directory needs shared UI, a loader, a guard, or a
route policy. Do not invent `layout.tsx`, `page.tsx`, `loading.tsx`, or
`error.tsx` conventions. `_` is reserved for pathless layouts; use `-` for
ignored colocation.

Examples:

```text
app/_public/index.tsx                 # /
app/users/$userId/index.tsx           # /users/:userId
app/dashboard/route.tsx               # nested dashboard layout
app/api/$.ts                           # server adapter for /api/*
app/health/index.ts                    # server adapter for /health
app/_authenticated/route.tsx           # future beforeLoad auth guard
```

## Elysia adapter isolation

`api/$.ts` registers GET, POST, PUT, PATCH, DELETE, OPTIONS, and HEAD and
delegates the original request directly to `app.fetch(request)`. `health/index.ts`
does the same for GET. These server-only routes have no component,
`errorComponent`, `pendingComponent`, or `notFoundComponent`; Elysia owns the
status and body, including failures. They do not proxy over the network or
render TanStack error/loading UI.

## UI data and navigation

UI routes use typed Eden clients. Server loaders may call the embedded app
client; browser components use the same-origin `/api/*` client. A feature that
hydrates TanStack Query shares query-option functions between its loader and
browser query to avoid duplicate requests. UI search parameters must use
`validateSearch` with Zod. Internal navigation uses typed `<Link>` or
`navigate`, including the future `_authenticated` `beforeLoad` guard.

## Metadata and route boundaries

Use `appConfig` from `src/lib/config.ts` for static brand values. Its
`appName`, `defaultTitle`, `defaultDescription`, `favicon`, and `repositoryUrl`
fields are the web app's single source of truth. Use `createMetadata` from
`src/lib/metadata.ts` in `head: () => ...`; nested TanStack head values merge
with the most-specific title/meta winning. Route metadata may override title or
description for a specific page. The root defaults come from `appConfig`. The
root `pendingComponent` uses the shadcn
Symmetric Wave primitive through `GlobalPending`; route-local pending states may
wrap the same component. `GlobalError` calls the supplied `reset()` and offers
a typed home link without exposing raw errors. `GlobalNotFound` handles missing
UI resources. Elysia responses remain outside all three UI boundaries.

Motion is progressive only: every animated route has a static equivalent and
honors `prefers-reduced-motion`. Content and actions never require motion.

`appConfig` is static and server-safe. Do not add credentials, database URLs,
or `process.env` reads to it; runtime secrets continue through the YAML config
loader and server-only runtime modules.

For a future searchable UI route, define a Zod validator explicitly:

```tsx
export const Route = createFileRoute("/users/")({
  validateSearch: z.object({ q: z.string().optional() }),
})
```

For a dynamic resource, use `$userId/index.tsx` and call `notFound()` for a
missing UI resource; do not put Prisma or credentials in the route. A future
authenticated tree belongs under `_authenticated/route.tsx` and performs its
guard in `beforeLoad`.

## Generated ownership and tests

Never edit `src/routeTree.gen.ts` manually. The TanStack plugin regenerates it
from `src/app`; run the web dev/build command after route changes and verify its
imports. Focused tests include:

```bash
bun test apps/web/src/app apps/web/src/lib
bun --cwd apps/web run check-types
```
