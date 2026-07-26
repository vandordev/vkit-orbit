# Worker

`apps/worker` is the Go/River executable. Root `internal/river` owns client
setup and default queue registration; root `internal/worker` owns idempotent
handlers and Go usecases; root `internal/notify` POSTs only to Elysia's worker
gateway. Go usecases may duplicate TypeScript application behavior when the
worker owns the mutation, but invariants, idempotency, concurrency, and
versioned River contracts must remain aligned. A notifier failure is returned
unchanged so River retries. The only baseline handler is the opt-in
`example.realtime-notification.v1` demonstration.
