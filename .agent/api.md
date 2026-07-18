# API

`apps/api/src/app.ts` is the Elysia factory. Business endpoints use the
standard success/failure envelope. The web adapter calls `app.fetch` directly;
the standalone Bun entrypoint is optional and is not part of default Compose.
`POST /api/internal/worker-events` authenticates `x-worker-notification-key`,
validates the shared event schema, and maps publisher outages to retryable 503.
