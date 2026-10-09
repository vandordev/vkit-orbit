# Verification and component-driven design

This is the active verification policy, linked from `AGENTS.md`. Historical
plans and command examples do not impose additional automatic gates.

## System changes

- Trust typed contracts, inferred types, and explicit domain types. Do not weaken
  types with `any`, unsafe casts, or non-null assertions to make checks pass.
  Use `unknown` with validation at untyped boundaries.
- For straightforward typesafe wiring or refactors, a fresh successful native
  typecheck completes verification. Do not automatically add tests, lint, builds,
  browser checks, or repository-wide gates afterward.
- Types cannot establish authorization, parsing/validation behavior, SQL constraints,
  migrations, transactions, concurrency, or external runtime behavior. State the
  concrete invariant and run the smallest relevant check. Use a focused failing
  test first where it provides meaningful regression protection. Preserve existing
  meaningful tests.
- PostgreSQL, Redis, Compose, and end-to-end checks require a concrete integration
  need or explicit user request. Do not provision services just to satisfy an old
  checklist. Never apply remote migrations without deployment authorization.
- Documentation/copy-only changes need document/formatting review, not runtime
  tests or typechecks for ceremony.
- Do not automatically run `task quality`, `task build`, or `task compose:smoke`.
  They remain available for deliberate, explicitly scoped integrated verification.

## UI changes

1. Before designing data-bearing UI or fixtures, inspect relevant models in
   `packages/database/prisma/schema.prisma`. Map values, filters, sorting, and
   aggregates to fields, relations, enums, or feasible derivations. Respect
   nullability and tenant/permission boundaries. Schema support does not prove
   runtime availability; inspect the relevant application/API implementation too.
   Report unsupported data before designing dependent UI. Do not invent fixture
   fields, assume future APIs, or change the schema without approval. Static copy
   and local UI state are not persisted product data.
2. Develop typed presentation components and colocated `*.stories.tsx` first.
   Stories render the actual components used by the app, not a duplicate demo.
   Separate fetching, auth, routing, and server dependencies; accept typed props
   and callbacks. Use deterministic fixtures and local providers, never production
   credentials or authenticated APIs.
3. Add/update stories for changed visible UI and interactions, including pages and
   layouts, not just primitives. Pure infrastructure needs no artificial stories.
   Cover relevant populated, pending, error, empty, disabled, and long-content
   states; responsive layouts and themes where supported. Do not invent themes
   or variants the application does not support.
4. Verify affected stories in the browser: appearance, realistic copy, interactions,
   keyboard/focus, responsive overflow, and accessible feedback. Typecheck and
   Storybook build alone cannot establish visual or interaction quality.
5. Check the existing Storybook at `http://localhost:6006` first. If absent or stale,
   ask whether the user will start/restart it or authorizes the agent to do so.
   Never start/restart without permission. Inspect processes/listeners, identify
   the old project instance, stop it and confirm exit before starting its replacement
   with `task dev:storybook`. Verify exactly one server, including duplicates on
   other ports. Never fall back to another port or an alternate preview server.
   Ask if ownership is unclear; do not broadly kill unrelated processes.
6. Integrate verified components into routes afterward. Derive tRPC inputs and
   response shapes from verified UI needs, using cohesive feature/domain routers.
   Validation, authorization, business rules, and secret filtering remain server-owned.
   Add route/end-to-end checks only for boundaries stories cannot establish, such
   as real auth or navigation integration.

## Reporting

Preserve unrelated changes; do not reformat unrelated files for global checks.
Report exact commands/evidence and unresolved boundaries. Blocked/skipped checks
are not passes. Stop after the applicable gate unless another concrete risk needs
evidence. Do not treat historical verification counts as current results.
