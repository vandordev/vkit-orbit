# Web

`apps/web` owns TanStack routes, `routeTree.gen.ts`, browser query clients, and
the embedded Elysia route adapters. `/api/*` delegates to `app.fetch` without a
network proxy. Realtime events only invalidate/refetch authoritative API data;
the opt-in `/examples/realtime` route has no default navigation link.

Use TanStack Start with Tailwind CSS and shadcn/ui primitives as the single UI
baseline. Keep accessible labels, focus states, responsive layouts, and typed
same-origin Eden calls. Do not reintroduce Next.js or Mantine as defaults.

See [routing.md](routing.md) for the complete directory-first route
convention, adapter isolation rules, and focused test commands.

The generated tree is owned by the TanStack plugin. Keep route-local helpers
under `-`-prefixed files or directories; `_` is reserved for pathless layouts.

Static web brand configuration lives in `apps/web/src/lib/config.ts` as the
`appConfig` single source of truth. It owns `appName`, `defaultTitle`,
`defaultDescription`, `favicon`, and `repositoryUrl`. Metadata and public UI
may override route-specific copy, but must not repeat the application defaults.
Secrets and runtime environment values remain in the YAML configuration
modules; `appConfig` never reads credentials or `process.env`.
