# Optional Auth Session and Audit Design

## Goal

Provide a removable, opt-in session-authentication and audit feature pack for
projects built from the boilerplate.

## Scope

- Neutral Prisma models for users, hashed sessions, and audit records.
- Password hashing and verification compatible with TanStack Start SSR.
- Opaque session tokens stored only as hashes in the database.
- Elysia cookie parsing, serialization, login, logout, current-user, and
  protected-route helpers.
- Session renewal, revocation, inactive-user rejection, and optional initial
  administrator bootstrap.
- Audit recording with recursive redaction of sensitive values.

## Out of scope

- A default auth requirement for all boilerplate routes.
- Product roles, workspace modules, capability catalogs, invitations, SSO, or
  provider identity integrations.

## Design

The pack is installed explicitly and owns its Prisma migration, application
service, API adapter, server-only configuration, and tests. The application
service is the sole owner of password, session, and audit transactions; routes
only validate input, call the service, and map known failures to envelopes.

Raw session tokens appear once when created and are delivered in an `HttpOnly`,
`SameSite=Lax`, path-root cookie. Cookie `Secure` is enabled only for HTTPS.
The database contains a token hash, expiry, revocation timestamp, and last-use
timestamp. Expired, revoked, absent, or inactive-user sessions are rejected.

The initial administrator is created by an explicit, idempotent command. Role
and authorization decisions are extension points for the consuming project,
not default schema or API policy.

## Acceptance criteria

- Tests cover bad credentials, normalized email, session hashing, renewal,
  logout, account deactivation, and idempotent bootstrap.
- API tests prove `401` for invalid session states and safe cookie attributes
  in HTTP and HTTPS modes.
- Audit tests prove password, hash, token, cookie, and authorization fields
  are absent from recursively nested audit payloads.
- No auth configuration or credential is exposed through Vite.
- The pack can be omitted without altering baseline routes or schema.
