# Realtime notification recipe

This opt-in recipe restores the executable `example.realtime-notification.v1`
walkthrough to a consumer project. The baseline never imports these files
automatically and remains free of a default job, schedule, route, credential,
or product model.

## Queue contract

Copy `files/packages/queue/src/example-realtime-notification.ts` to the
consumer's queue package and export it from that package's index. The contract
validates non-empty `resourceId` and `workspaceId` and keeps the versioned kind
`example.realtime-notification.v1`.

## API registration

Copy `files/apps/api/src/routes/examples.ts` to `apps/api/src/routes/examples.ts`.
Export `createExampleRoutes` and add
`.use(createExampleRoutes(enqueueExample))` in the consumer app factory. The
consumer supplies an `enqueueExample` adapter backed by its queue client.

## Scheduler registration

Copy `files/apps/scheduler/src/schedules.ts` to the scheduler source. Register
it explicitly through the baseline runtime:

```ts
await runScheduler({
  register: () => registerSchedules(
    { enqueue: (contract, payload) => enqueue(river, contract, payload) },
    { intervalMs: 300_000 },
  ),
  disconnect: () => prisma.$disconnect(),
});
```

The timer is recipe-local and cleanup clears it during shutdown. No interval
or environment key is added to the baseline config.

## Worker registration

Copy `files/apps/worker/internal/worker/example_realtime_notification.go` to
`apps/worker/internal/worker/`. Create the notifier from server-only consumer
configuration and pass it to `ExampleRealtimeNotificationWorker` when calling
`NewWorkerClient`. The handler validates the payload and notifies Elysia only
after successful work; it never calls Socket.IO.

## Web route registration

Copy `files/apps/web/src/routes/examples/realtime.tsx` to
`apps/web/src/routes/examples/realtime.tsx`, then regenerate the TanStack route
tree. The walkthrough requires a product-issued realtime ticket and invalidates
authoritative API queries when the generic realtime event arrives.

## Removal

Remove the copied queue contract, API route/export and enqueue adapter, recipe
scheduler registration, worker handler/registration, and web route. Regenerate
the route tree and remove any recipe-local configuration and credentials. No
baseline file needs to be changed when the recipe is removed.

## Integration files

The `files/integration/` notes contain the same copy targets and registration
points in boundary-specific form for consumers that prefer a checklist.
