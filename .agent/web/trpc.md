# UI contracts and tRPC

Web owns the same-origin `/trpc` boundary. Server context and routers live under
`apps/web/src/trpc`; browser code imports only the `AppRouter` type from server
modules. Keep credentials, Prisma, and business rules server-owned.

Before data-bearing UI/stories, inspect the Prisma schema and relevant runtime
implementation. Map display values, filters, sorts, and aggregates to available
data. Preserve enums, nullability, tenant scoping, and authorization. Report
unsupported requirements before building dependent UI; do not invent mock fields
or expand the schema without approval.

After that feasibility check, develop and verify presentation components in
Storybook first. Derive procedure inputs and response shapes from their data and
interaction needs, not raw database models. Extend cohesive domain/feature routers
under `src/trpc/routers` and register them once in `index.ts`. Multiple routers
share one transport boundary.

Current browser calls use the typed proxy from `src/trpc/client.ts` and TanStack
Query. Preserve that installed API; generated Query options, a new provider API,
or global mutation toasts are not installed by this guidance. QueryProvider owns
global successful-mutation invalidation; do not duplicate it in every feature.

Keep shareable filters, sorting, pagination, and tabs in Zod-validated route search.
Reset pagination when relevant filters/sorting change. Render relevant pending,
error, empty, filtered-empty, and populated states. Keep expected form errors
inline and prevent duplicate submissions. Retry mutations only with a justified
idempotency contract. UI-shaped responses never bypass server validation or auth.
