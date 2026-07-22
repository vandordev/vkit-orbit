# Worker and Provider Reliability Recipe

This opt-in recipe demonstrates reliable fan-out work without adding a
baseline product schema, provider, worker, or schedule. Copy it deliberately
and adapt the repository boundary to the consumer's PostgreSQL schema.

## State model

| Item state | Meaning | Next states |
| --- | --- | --- |
| `PENDING` | eligible for a short claim transaction | `PROCESSING` |
| `PROCESSING` | claimed; provider call is outside the transaction | `SENT`, `FAILED`, `UNKNOWN`, `PENDING` |
| `SENT` | provider accepted the item | terminal |
| `FAILED` | known terminal provider failure | terminal |
| `UNKNOWN` | timeout/indeterminate result requiring reconciliation | terminal until reconciled |

Retryable provider failures transition `PROCESSING → PENDING`. A timeout is
`UNKNOWN`, never an automatic success. The parent aggregate is `COMPLETED`,
`FAILED`, or `PARTIALLY_FAILED` only after no active item remains. A terminal
parent cannot be overwritten by a later continuation.

## Boundaries and invariants

`Repository` owns PostgreSQL and transactions; `Worker` owns River orchestration
and provider calls. Every item has a stable idempotency key, persisted with the
attempt/outcome and passed to the provider. Claiming uses
`FOR UPDATE OF item SKIP LOCKED`, marks `PROCESSING`, and commits before any
network call. Outcome persistence is a separate atomic transaction with state
guards. A follow-up job is enqueued at most once while pending work remains.

The producer contract is `fanout-delivery.v1`. Workers notify Elysia only after
successful outcome persistence; realtime remains behind Elysia and is never
called directly by a worker. Breaking payload changes require a new versioned
River kind.

## Optional installation

Copy the Go repository/worker example and the TypeScript producer into their
own owning boundaries, add a consumer migration for the neutral tables/enums,
then register a schedule explicitly. Remove those copied files and the
consumer migration deliberately to uninstall.

The optional advanced data-table or provider implementation is intentionally
not included; consumers own its dependency, retry classification, and
maintenance budget.
