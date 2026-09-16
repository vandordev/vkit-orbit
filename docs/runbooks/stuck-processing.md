# Stuck processing

## Symptoms

A run remains queued or leased beyond its configured stage timeout.

## Impact

The affected document has no current report and may delay webhook delivery.

## Diagnosis

Run `docker compose logs worker`, inspect `/health/ready`, and query the run and outbox by ID in PostgreSQL.

## Containment

Do not manually edit status rows; stop repeated operator retries and preserve correlation IDs.

## Recovery

Restart the worker and invoke the bounded recovery command through `task compose:smoke`.

## Verification

Confirm the stale revision is a no-op, the current revision completes, and exactly one result artifact exists.

## Stop conditions

Stop if the run is completed/canceled, storage is unavailable, or a revision invariant is violated.
