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
