# Worker integration

Copy the recipe worker into `apps/worker/internal/worker/`. Construct the
notifier from server-only worker gateway configuration and register the worker
callback with `NewWorkerClient`. The handler calls only the Elysia notifier
after successful validation/work; Elysia publishes to Socket.IO.
