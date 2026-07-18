# Worker

`apps/worker` is Go/River. `internal/river` owns client setup and default queue
registration; `internal/worker` owns idempotent handlers; `internal/notify`
POSTs only to Elysia's worker gateway. A notifier failure is returned unchanged
so River retries. The only baseline handler is the opt-in
`example.realtime-notification.v1` demonstration.
