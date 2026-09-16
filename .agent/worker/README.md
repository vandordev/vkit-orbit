# Worker

`apps/worker` is the long-running TypeScript BullMQ consumer and outbox relay.
Handlers parse versioned payloads, re-read PostgreSQL state, and notify the API
gateway only after successful business transitions. PostgreSQL owns business
retry and idempotency; BullMQ owns bounded infrastructure retries. Logs use
safe correlation and job context, never document bytes or credentials.
