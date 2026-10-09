# Web

Follow [verification.md](../verification.md): UI uses Storybook plus typecheck;
server-side tRPC/adapters and all service work use typecheck only. Do not start
the product stack, run system tests, or add lint/build/full-repository gates.
New or changed UI follows component-driven design: check persisted-data feasibility
and runtime support, develop typed presentation components with colocated stories,
verify them in Storybook, then integrate routes/tRPC. Presentation components do
not fetch data or import real API clients, route adapters, or server modules.
Read [the Storybook guidance](../../apps/storybook/README.md) for discovery,
fixtures, styling, and the permission-required server lifecycle on port 6006.

`apps/web` owns TanStack routes, `routeTree.gen.ts`, browser query clients, and
same-origin tRPC. Elysia is standalone `/v1`, not embedded or proxied by web.
Realtime events only invalidate/refetch authoritative data.

Use TanStack Start with Tailwind CSS and shared Vandor UI primitives as the UI
baseline. Small UI primitives must import `@repo/components/<name>`, not local
`@/components/ui` copies; install missing primitives in the shared package first.
Button and Loading are installed. Read [component rules](../components.md) and
[package guidance](../../packages/components/README.md). The local Button and its
stories are removed; remaining local presentation stays intact until explicitly
migrated. Keep accessible labels, focus states, responsive layouts, and typed
same-origin tRPC calls. Do not reintroduce Next.js or Mantine as defaults.

See [routing.md](routing.md) for the complete directory-first route
convention, adapter isolation rules, and native typecheck command.
See [trpc.md](trpc.md) for UI-driven contracts and server-owned boundaries.
For TanStack Start SEO, use the `tanstack-seo` skill and [SEO rules](seo.md).
Adapt its examples to `src/app` and `appConfig`; do not invent a public domain or
index private content. SEO server/head changes follow system typecheck-only verification.

The generated tree is owned by the TanStack plugin. Keep route-local helpers
under `-`-prefixed files or directories; `_` is reserved for pathless layouts.

Brand name, logo, and color tokens are owned by `packages/brand`; see its
[README](../../packages/brand/README.md). Import `@repo/brand` and its asset/CSS
entrypoints instead of duplicating values. `apps/web/src/lib/config.ts` is the web
adapter: `appName` and `defaultTitle` derive from brand, while `defaultDescription`,
`favicon`, and `repositoryUrl` remain app configuration. Metadata and public UI
may override route-specific copy, but must not repeat brand or application defaults.
Secrets and runtime environment values remain in the single YAML configuration
and lazy server-only typed getters; `appConfig` never reads credentials or
`process.env`. Browser realtime gets only `{ realtimeUrl }` from same-origin
`config.public` at runtime, separate from the authenticated ticket. No deployment
env or build injection. Public schema/types use `@repo/config/public` only.
