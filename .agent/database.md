# Database Rules

- Only `packages/db` creates or exports the Prisma client.
- `getPrisma()` initializes lazily with the narrow typed database URL supplied
  explicitly as `datasourceUrl`. Never construct it during import or mutate
  process environment as the configuration bus. Preserve injected transactions.
- Scheduler/realtime/public config do not initialize Prisma. Prisma CLI uses
  the narrow database/environment child adapter; no migration changes are
  authorized by a config change.
- Schema changes belong in `packages/db/prisma/schema.prisma` and must have a Prisma migration.
- Never add product models to the boilerplate; domain models are introduced by the consuming project.
- Usecases own Prisma writes and transactions. Routes must not duplicate mutation rules.
- Keep list queries bounded and add indexes when a feature introduces frequently filtered fields.
