# Web

`apps/web` owns TanStack routes, `routeTree.gen.ts`, browser query clients, and
the embedded Elysia route adapters. `/api/*` delegates to `app.fetch` without a
network proxy. Realtime events only invalidate/refetch authoritative API data;
the opt-in `/examples/realtime` route has no default navigation link.
