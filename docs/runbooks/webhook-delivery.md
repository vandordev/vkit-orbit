# Webhook delivery

## Symptoms

Delivery attempts are retrying, delayed, or returning terminal HTTP failures.

## Impact

External consumers may not yet know a processing outcome; stored bytes remain authoritative.

## Diagnosis

Run `docker compose logs worker` and inspect webhook delivery attempts and their `correlationId` in PostgreSQL.

## Containment

Disable the endpoint or receiver route; never regenerate or edit the stored envelope.

## Recovery

Repair the receiver, then use the application retry operation; PostgreSQL schedules the next attempt.

## Verification

Compare request body and signature input across attempts and confirm the endpoint reaches its terminal outcome.

## Stop conditions

Stop on secret exposure, unknown external outcome, or any request-body mismatch.
