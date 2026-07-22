# Worker and Provider Reliability Recipe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Broadcaster's reliable fan-out worker practices as a neutral, executable recipe.

**Architecture:** A recipe example separates River worker orchestration from a PostgreSQL repository. It uses a versioned job contract, short claim transactions, external calls outside transactions, atomic outcome persistence, and Elysia notifications after persistence.

**Tech Stack:** Go, River, PostgreSQL, Elysia internal notification gateway, Bun tests.

---

## File structure

- Create: `recipes/worker-provider-reliability/README.md` — state machine and installation guide.
- Create: `recipes/worker-provider-reliability/files/contracts/jobs/fanout-delivery.v1.md` — cross-language payload contract.
- Create: `recipes/worker-provider-reliability/files/apps/worker/internal/fanout/{worker.go,repository.go,worker_test.go}` — neutral Go example.
- Create: `recipes/worker-provider-reliability/files/packages/queue/src/fanout-delivery.ts` — producer example.

### Task 1: Define state machine and repository interface

- [ ] Write failing Go tests for `ClaimNext`, `PersistOutcome`, `HasPending`, and `Aggregate`; test states `PENDING`, `PROCESSING`, `SENT`, `FAILED`, and `UNKNOWN`.
- [ ] Add a README state table: retryable provider failure transitions `PROCESSING → PENDING`; timeout transitions to `UNKNOWN`; terminal aggregate is completed, failed, or partially failed only when no active item remains.
- [ ] Define a repository interface whose claim returns one item and whose persistence receives a complete outcome record; worker code must not execute SQL directly.
- [ ] Run `rtk go test ./recipes/worker-provider-reliability/...`; expect interface/test failures. Commit `docs(recipe): define reliable fanout state model`.

### Task 2: Implement safe claim and persistence examples

- [ ] Add SQL-source tests asserting `FOR UPDATE OF item SKIP LOCKED`, no `GROUP BY` in the locked claim query, and explicit enum casts where enum columns are used.
- [ ] Implement a short `BeginTx → lock parent → claim pending item → mark PROCESSING → Commit` flow. Implement a distinct transaction for attempt/outcome persistence and guarded parent aggregate update.
- [ ] Run Go tests; expect PASS. Commit `feat(recipe): add postgres-safe fanout repository`.

### Task 3: Implement worker orchestration and lifecycle tests

- [ ] Add tests with a fake repository/provider for retryable failure, timeout, two-item queue draining, all-success, all-failed, mixed aggregate, and notifier failure.
- [ ] Implement worker flow: claim, call provider outside transaction, classify error, persist, enqueue one follow-up if pending, then notify Elysia. Return provider/notifier errors unchanged when River should retry.
- [ ] Run `rtk go test ./recipes/worker-provider-reliability/... -count=1`; expect PASS. Commit `feat(recipe): add fanout worker lifecycle`.

### Task 4: Align producer and contract documentation

- [ ] Add a Bun test that producer kind is exactly `fanout-delivery.v1` and payload validation rejects missing parent/item identity.
- [ ] Implement the TypeScript producer and document versioning rules, idempotency-key placement, and Elysia-only realtime boundary.
- [ ] Run recipe Bun/Go tests, then `rtk task quality`. Commit `docs(recipe): complete fanout provider contract`.

