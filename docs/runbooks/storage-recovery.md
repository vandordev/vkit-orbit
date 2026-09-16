# Storage recovery

## Symptoms

Upload `HEAD`, MinIO health, signed downloads, or artifact reads fail.

## Impact

New documents cannot be confirmed and completed reports may not download.

## Diagnosis

Run `docker compose ps minio`, `docker compose logs minio`, and inspect the object key from the correlated application log.

## Containment

Keep source/result keys unchanged and reject unsupported or unverified uploads.

## Recovery

Restart MinIO or restore its persistent volume, then rerun the affected confirmation or download authorization.

## Verification

Upload and download a test object, compare bytes, and confirm no credential or signed query is logged.

## Stop conditions

Stop if a workspace prefix is wrong, an object is missing, or a signed URL is expired/reused.
