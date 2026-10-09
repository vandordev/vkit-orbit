# Verification and component-driven design

This is the active verification policy, linked from `AGENTS.md`. Verification
has exactly two tracks: UI uses Storybook plus typecheck; system uses typecheck
only. Historical plans, risk-based testing guidance, and command examples do not
override these gates. Documentation-only changes use document/formatting review.

## System changes

- System includes database/backend integration and all service-related work:
  API, same-origin tRPC, application rules, database/Prisma, queue, worker,
  scheduler, realtime, migrations, storage, and external service adapters.
  Server-side code in `apps/web` belongs to this track, not the UI track.
- Run only fresh repository-native typechecks for affected owners and consumers.
  Stop after successful typecheck. Inspect the command first: it must not start
  services, containers, or migrations through prerequisites or lifecycle hooks.
- Trust typed contracts, inferred types, and explicit domain types. Do not weaken
  types with `any`, unsafe casts, or non-null assertions to make checks pass.
  Use `unknown` with validation at untyped boundaries.
- Do not run system tests (including unit, integration, smoke, or end-to-end),
  lint/build gates, `task quality`, `task build`, Compose, Docker containers,
  databases, Redis, backend dev servers, workers, schedulers, realtime servers,
  migration commands, or live service probes for verification. Do not substitute
  another launcher or tool to bypass this resource limit. A perceived risk or
  integration need is not permission to run them.
- Preserve existing tests, but do not execute them as part of this track.
  These commands may remain in the repository for other purposes; their presence
  does not authorize execution. Any exception needs a new explicit user instruction.
- Typecheck cannot establish authorization, validation behavior, SQL constraints,
  migrations, transactions, concurrency, or live integrations. Report these as
  runtime-unverified where relevant, never as proven by typecheck. If there is no
  safe typecheck for a changed artifact, report the gap rather than substituting
  a runtime check. Never apply remote migrations without deployment authorization.

## UI changes

UI includes presentation primitives, layouts, pages, and local interactions.
The gate is fresh typecheck of affected owners/consumers plus browser inspection
of affected Storybook stories. Stories use local fixtures/providers only; do not
start or call a backend/database/service to verify UI. Do not add automatic lint,
build, full-repository, or system test gates. Standalone Storybook is the only
preview runtime allowed by this track, subject to the lifecycle permission below.

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
   keyboard/focus, responsive overflow, and accessible feedback. Typecheck alone
   cannot establish visual or interaction quality. A static Storybook build is
   not required and does not replace browser inspection.
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
   Real auth, persisted data, and backend integration belong to the system track:
   typecheck only, with runtime coverage explicitly reported as unverified.

## Mixed changes

Apply each gate to its own boundary: presentation uses Storybook plus typecheck;
system wiring uses typecheck only. A UI change does not authorize starting the
product stack. Schema/runtime feasibility inspection is read-only source review,
not permission to connect to a database or run a service.

## Reporting

Preserve unrelated changes; do not reformat unrelated files for global checks.
Report exact commands/evidence and unresolved boundaries. Blocked/skipped checks
are not passes. Distinguish UI browser evidence from system type safety and list
runtime-unverified boundaries without claiming integration success. Stop after
the applicable gate; risk does not expand execution authority. Do not treat
historical verification counts as current results.
