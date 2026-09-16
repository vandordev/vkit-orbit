# PostgreSQL recovery

## Symptoms

Readiness fails, migrations do not complete, or transactions time out.

## Impact

All business mutations and recovery scans are unavailable; Redis cannot replace truth.

## Diagnosis

Run `docker compose ps db`, `docker compose logs db`, and `docker compose exec db pg_isready -U boilerplate -d boilerplate`.

## Containment

Stop web/API writes and retain the database volume; do not delete or reset it.

## Recovery

Restore the approved PostgreSQL backup, run `docker compose up migrate`, then start dependent services.

## Verification

Run `task quality`, inspect migration completion, and execute `task compose:smoke`.

## Stop conditions

Stop on failed backup integrity, schema mismatch, or any unexplained data loss.
