# Worker and Provider Reliability Recipe Design

## Goal

Document and package a domain-neutral recipe for reliable fan-out work backed
by PostgreSQL, River, and an external provider.

## Scope

- A neutral reference contract for a parent run, work item, provider attempt,
  and terminal aggregate state.
- A repository boundary that isolates PostgreSQL persistence from River worker
  orchestration.
- Short transactional item claims with `FOR UPDATE ... SKIP LOCKED`.
- Provider calls outside database transactions.
- Atomic attempt/outcome persistence, retry policy, continuation enqueueing,
  terminal aggregation, and post-success invalidation notification.
- PostgreSQL-focused concurrency and lifecycle test patterns.

## Out of scope

- Adding a default fan-out schema, worker, provider, or schedule to the
  boilerplate.
- Reusing Broadcaster campaign, recipient, or provider-specific SQL.

## Design

The recipe defines interfaces and a worked example rather than a default
product feature. A worker claims one pending item in a brief transaction,
marks it processing, commits, then invokes the provider. A separate
transaction persists the attempt and outcome. Retryable failures return the
item to pending and surface an error to River; indeterminate failures use a
distinct terminal state for later reconciliation.

The repository calculates terminal parent state from item outcomes and updates
it only when it is not already terminal. When work remains, the worker enqueues
one follow-up. It only notifies Elysia after a successful persistence step; the
notifier failure remains retryable.

## Acceptance criteria

- The recipe states the required idempotency key and state-transition guards.
- Its SQL example uses `SKIP LOCKED`, does not combine row locking with invalid
  grouped queries, and explicitly casts PostgreSQL enum parameters where used.
- Tests cover concurrent claims, retryable provider failure, timeout/unknown
  outcome, all-success, all-failed, mixed terminal state, and queue draining.
- The recipe preserves the existing cross-language versioned River contract
  rules and Elysia-only realtime notification boundary.
