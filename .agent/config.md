# Configuration

One `config/config.yaml` is the active YAML 1.2 document. `packages/config`
validates strict known keys/template grammar globally, selects explicit runtime
fields, interpolates values once after parsing, and validates with Zod 4. No
module merging, env-core, aliases/anchors/tags/includes, or fallback config paths.
Operational defaults belong to YAML; secrets have no committed fallback.
Diagnostics identify file/runtime/field and safe reasons, never resolved values.

Use lazy typed getters from `@repo/config/server`. Importing them does not read
files, resolve credentials, or create resources. Snapshots last until restart.
Database/public/webhook getters select narrow fields, not whole runtime objects.
Scheduler selects app/Redis only; realtime selects app/listener/ticket/publisher;
migrate selects database/environment only. Field selection must not resolve
another process's secrets. Prisma receives the explicit URL in `packages/db`.

Browser code may import only `@repo/config/public` schema/types. Deployment config
never uses VITE_/PUBLIC_ variables or build injection. `config.public` returns only
`{ realtimeUrl }` via same-origin tRPC without session/database lookup, no-store
including batches/failures. Socket construction requires that URL and a separate
authenticated ticket; no persistent cache or client fallback.

Dev loads root `.env` explicitly. Deployment uses injected environment and trusted
application root (`--root /app`, propagated as bootstrap-only
`ORBIT_APPLICATION_ROOT`), independent of bundled source layout/caller CWD.
Tools get narrow child environments: listener PORT/HOSTNAME/NODE_ENV or Prisma
DATABASE_URL/NODE_ENV. No global environment mutation or generic flattening.
The production web launcher validates full web config before starting Nitro;
Vite's development tooling selection resolves listener fields only.
Build does not load runtime config or require real secrets. Production requires
explicit DATABASE_URL for database consumers and REALTIME_URL for public/web.
Optional credentials retain all-or-none rules; enabled operations still require
their existing credentials. Preserve test database/Redis isolation adapters.

Verification follows `.agent/verification.md`: source/config/lockfile review and
fresh typecheck only. Fixtures are not executed; runtime integrations unverified.
