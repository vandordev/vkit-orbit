# Auth Session and Audit Recipe

This is an opt-in, removable feature pack. It adds neutral users, opaque
sessions, password verification, and recursively redacted audit records; it
does not add a baseline route, role, capability, credential, or product model.

## Installation order

1. Copy the schema fragment and create a consumer-owned schema migration.
2. Copy the application exports and register the application service.
3. Copy and register the API route registration.
4. Add the server config values (server-only) to the consumer's config loader.
5. Copy the optional web shell and connect consumer-owned current-user and
   logout callbacks.

The consuming project owns roles, authorization policy, initial credentials,
and any user-facing route names. Required server-only variables are
`AUTH_SESSION_SECRET`, `AUTH_SESSION_TTL_SECONDS`, and, for explicit bootstrap,
`AUTH_BOOTSTRAP_EMAIL` and `AUTH_BOOTSTRAP_PASSWORD`.

## Schema

`files/packages/database/prisma/schema.prisma.fragment` is intentionally a
fragment. Copy it into the consumer schema, resolve the relation names to its
existing models if needed, then run `prisma migrate dev` or the project's
equivalent migration command. The consumer must never store raw session tokens.

## Removal

Stop registering the routes, remove copied application/API/config/web files,
and create a deliberate consumer migration if the three models are no longer
needed. Removing this directory alone never changes the baseline.

## Extension points

Authorization is supplied as a consumer-owned predicate/policy interface;
there are no default role or capability enums. Audit payloads are redacted
recursively before persistence.
