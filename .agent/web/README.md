# Web

Follow [verification.md](../verification.md), not automatic full-repository gates.
New or changed UI follows component-driven design: check persisted-data feasibility
and runtime support, develop typed presentation components with colocated stories,
verify them in Storybook, then integrate routes/tRPC. Presentation components do
not fetch data or import real API clients, route adapters, or server modules.
Read [the Storybook guidance](../../apps/storybook/README.md) for discovery,
fixtures, styling, and the permission-required server lifecycle on port 6006.

`apps/web` owns TanStack routes, `routeTree.gen.ts`, browser query clients, and
the embedded Elysia route adapters. `/api/*` delegates to `app.fetch` without a
network proxy. Realtime events only invalidate/refetch authoritative API data;
the opt-in `/examples/realtime` route has no default navigation link.

Use TanStack Start with Tailwind CSS and shared Vandor UI primitives as the UI
baseline. Small UI primitives must import `@repo/components/<name>`, not local
`@/components/ui` copies; install missing primitives in the shared package first.
Only Button is initially
installed. Read [component rules](../components.md) and
[package guidance](../../packages/components/README.md). The local Button and its
stories are removed; remaining local presentation stays intact until explicitly
migrated. Keep accessible labels, focus states, responsive layouts, and typed
same-origin tRPC calls. Do not reintroduce Next.js or Mantine as defaults.

See [routing.md](routing.md) for the complete directory-first route
convention, adapter isolation rules, and focused test commands.
See [trpc.md](trpc.md) for UI-driven contracts and server-owned boundaries.

The generated tree is owned by the TanStack plugin. Keep route-local helpers
under `-`-prefixed files or directories; `_` is reserved for pathless layouts.

Static web brand configuration lives in `apps/web/src/lib/config.ts` as the
`appConfig` single source of truth. It owns `appName`, `defaultTitle`,
`defaultDescription`, `favicon`, and `repositoryUrl`. Metadata and public UI
may override route-specific copy, but must not repeat the application defaults.
Secrets and runtime environment values remain in the YAML configuration
modules; `appConfig` never reads credentials or `process.env`.
