# Redis recovery

## Symptoms

Queue health is failing, jobs stop advancing, or Redis has restarted.

## Impact

Delivery and scheduling pause; PostgreSQL remains the source of truth.

## Diagnosis

Run `docker compose ps`, `docker compose logs redis`, and `docker compose exec redis redis-cli ping`.

## Containment

Stop new deploys and keep worker retries paused while disk and memory are checked.

## Recovery

Run `docker compose restart redis`, then `docker compose exec redis redis-cli info persistence`; run `task compose:smoke` to reconstruct due work.

## Verification

Confirm Redis is healthy, recovery reports no skipped scenarios, and a document reaches a terminal state once.

## Stop conditions

Stop and escalate if AOF is disabled/corrupt, disk is full, or PostgreSQL is unavailable.
