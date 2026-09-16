# Incident triage

## Symptoms

Multiple health checks, user journeys, or queue outcomes fail together.

## Impact

Assess affected workspaces, documents, API clients, and webhook consumers before changing state.

## Diagnosis

Capture `docker compose ps`, `docker compose logs`, health endpoints, request IDs, and the failing smoke scenario.

## Containment

Pause deploys and risky retries; redact credentials and document content before sharing evidence.

## Recovery

Follow the narrow service runbook, restore dependencies in order, and use PostgreSQL recovery rather than Redis edits.

## Verification

Run `task quality && task build && task compose:smoke`; confirm all scenarios execute and exit zero.

## Stop conditions

Stop and escalate for data loss, secret exposure, cross-workspace access, or any skipped acceptance scenario.
