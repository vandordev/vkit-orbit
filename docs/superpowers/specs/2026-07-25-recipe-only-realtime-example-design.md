# Recipe-Only Realtime Example Design

## Goal

Remove the default realtime-notification worked example from the boilerplate
baseline. Keep scheduler and worker runtimes long-running and domain-neutral;
ship the complete executable walkthrough as an explicitly installed recipe.

## Scope

- Keep `apps/scheduler` alive until `SIGINT` or `SIGTERM`, even when no
  consumer schedule is registered.
- Keep `apps/worker` as a long-running River client without a default job
  handler.
- Remove `ENABLE_EXAMPLE_SCHEDULE`, `EXAMPLE_SCHEDULE_INTERVAL_MS`, and every
  baseline registration/import of `example.realtime-notification.v1`.
- Create `recipes/realtime-notification/` containing the queue contract,
  scheduler registration, worker handler registration, API route registration,
  web walkthrough, tests, and installation/removal instructions.
- Retain generic Socket.IO ticket validation, room authorization, Elysia's
  authenticated internal worker-event gateway, and generic invalidation event
  contracts in the baseline.
- Update baseline documentation and contract references to state that no
  product/example job or schedule is installed by default.

## Out of Scope

- Adding a product/domain model, user authentication, default credentials, or
  default schedules.
- Removing the optional realtime runtime or changing the public web/API
  topology.
- Changing the versioned River contract rules or allowing workers to call
  Socket.IO directly.

## Architecture

The baseline has reusable process infrastructure only:

```text
apps/scheduler -- waits for shutdown signal; no default timer/job --> PostgreSQL/River
apps/worker    -- River client with consumer-installed handlers only --> Elysia gateway
apps/realtime  -- ticket/room authorization and private publish endpoint
apps/api       -- generic authenticated worker-event gateway
```

`recipes/realtime-notification/` is a copy/install pack. A consuming project
copies its files into the owning baseline boundaries and deliberately wires:

1. `example.realtime-notification.v1` producer and payload contract;
2. Elysia enqueue route registration;
3. scheduler timer registration;
4. Go worker handler registration;
5. web walkthrough route registration.

The recipe worker notifies Elysia only after job success. Elysia remains the
only process that publishes to Socket.IO. Recipe payloads remain invalidation
signals; consumers refetch authoritative data from HTTP.

## Lifecycle

Scheduler startup may construct queue dependencies, call a consumer-supplied
schedule registration function, and then wait on a signal-aware promise. Its
shutdown sequence clears registered timers, disconnects Prisma, and exits with
status zero. With no installed schedule, the registration function returns a
no-op cleanup and the process still remains alive.

Worker startup creates the River client and starts it even when no handler is
registered. It remains alive until River stops after the process context is
cancelled. The baseline does not construct a notifier unless a consumer-owned
handler needs one.

## Configuration

The baseline scheduler config no longer defines `ENABLE_EXAMPLE_SCHEDULE` or
`EXAMPLE_SCHEDULE_INTERVAL_MS`. Recipe installation documents any example
interval as recipe-local configuration and never adds a default value to
`config/` or browser-visible Vite environment declarations.

## Testing and Acceptance Criteria

- A scheduler lifecycle test proves the baseline remains running without a
  registered timer and executes its cleanup after shutdown.
- A worker setup test proves no baseline example handler is registered.
- Baseline config, queue, API routes, web routes, generated route tree, and
  documentation contain no example job/schedule imports or example route.
- Recipe tests prove its TypeScript payload validation, API enqueue adapter,
  schedule registration, Go handler, and web walkthrough are present and
  remain isolated from baseline imports.
- `task quality`, `task build`, and default Compose smoke checks pass with an
  idle scheduler/worker profile. The recipe is not started by default.

## Migration and Removal

This is a source-only boilerplate change: no Prisma/River data migration is
required. Consumers that previously enabled the old example remove its queue
jobs and copied route/worker/schedule files according to their own retention
policy. New consumers install the recipe only when they need the walkthrough.
