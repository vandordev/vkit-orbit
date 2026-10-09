# Unified runtime configuration and Zod 4

## Status and authority

Design direction approved in conversation; this written specification awaits
user review before an implementation plan is written. No implementation is
authorized by publication of this document alone.

This specification governs the configuration migration in `vkit-orbit`. It
replaces historical modular-YAML and client-environment requirements only for
this work. It does not change workspace-wide authority or verification policy.

## Goal

Use one valid YAML file, `config/config.yaml`, as the declarative runtime
configuration source. Resolve environment references in memory and validate
with Zod 4. Each process receives only its required typed configuration.

The browser receives an explicit public projection through same-origin tRPC.
Deployment-specific browser values must not be embedded in a Docker image at
build time. The same image must support different runtime environments.

All project-owned Zod usage moves to Zod 4, with no resolved Zod 3 dependency
remaining in the lockfile.

## Current evidence

- `packages/config/src/loader.ts` parses YAML before interpolation. Preserve
  this ordering, but replace module merging with a single-file loader.
- `packages/config/src/run.ts` converts scalar configuration back to environment
  strings and discards nested values. This is not the target application API.
- `packages/config/src/common.ts` and runtime adapters validate flat environment
  objects through `@t3-oss/env-core`.
- `apps/web/src/lib/realtime.ts` reads `VITE_REALTIME_URL` from a build-time
  client environment.
- `apps/web/src/app/_authenticated/app/-components/realtime-bridge.tsx` already
  obtains an authenticated realtime ticket through tRPC.
- `apps/web/src/trpc/context.ts` performs eager cookie/session lookup; public
  config must not depend on that lookup.
- `apps/web/src/app/trpc/$.ts` propagates context response headers to the HTTP
  response, which provides the existing place to enforce no-store caching.
- `apps/web/package.json` hardcodes the development web port and runs the
  modular config launcher during build.
- `Dockerfile.web` and `docker-compose.yml` contain build/runtime configuration
  wiring that must be separated.
- `packages/db/src/client.ts` is the sole Prisma client owner, currently using
  implicit environment configuration.
- `apps/scheduler/src/main.ts` indirectly requires common database configuration
  despite its enqueue-only ownership.
- Five manifests declare Zod 3: `apps/api/package.json`,
  `apps/web/package.json`, `packages/config/package.json`,
  `packages/queue/package.json`, and `packages/realtime/package.json`.
- `bun.lock` resolves Zod 3.25.76 for project code and Zod 4.4.3 for TanStack
  tooling. `packages/queue/src/contracts/types.ts` uses `ZodTypeAny`.

These observations are source evidence, not proof of runtime integrations.

## Scope and exclusions

In scope:

- Full replacement of the nine modular YAML files by `config/config.yaml`.
- Typed config consumption across web, API, worker, scheduler, realtime,
  migrations, database ownership, and relevant application/service adapters.
- Zod 4 migration across all project-owned schemas, fixtures, recipes, and
  consumer types; removal of Zod 3 from dependency resolution.
- Runtime-only browser realtime URL through `config.public`.
- Launcher, Docker, Compose, environment-example, architecture-guard, existing
  test-source, and active documentation alignment.

Out of scope:

- New feature flags, auth bypass, rate-limit behavior, or product functionality.
- Brand identity changes or moving `@repo/brand` into YAML.
- Hot reload, remote config services, overlay files, arbitrary includes,
  tenant-specific config, and user-selectable config paths or keys.
- Changing BullMQ kinds, JSON payloads, realtime events, or ticket formats.
- Backend/runtime verification beyond the repository's authorized typechecks.

There is no compatibility period, fallback to modular YAML, or fallback to
`VITE_REALTIME_URL`. Historical plans/specs remain historical documents.

## Architecture decision

Use the existing `yaml` package and Zod 4 directly. Remove
`@t3-oss/env-core` from the new pipeline rather than flattening nested YAML
back into an environment object. T3 Env supports Zod 4; removal is a design
simplification, not an incompatibility workaround.

`packages/config` owns file loading, interpolation, schemas, runtime selection,
and narrowly scoped tooling adapters. Runtime config entrypoints are server-only.
A separate client-safe entrypoint may export the public output schema and types,
but must not re-export loaders, filesystem imports, secret schemas, or values.

Feature code consumes typed config and does not read environment variables.
There is no generic service locator, plugin framework, internal-Zod schema
introspection, or environment mutation as the application config mechanism.

## Configuration document

The sole default document is `config/config.yaml`, rooted at the repository or
deployed application root, not dependent on the caller's working directory.
An explicit file path may be supplied by trusted bootstrap/tooling code and
local fixtures. HTTP callers cannot select it.

Use nested camelCase keys. Environment names remain uppercase. The canonical
namespaces and semantic fields are:

| Namespace  | Fields                                                                                                |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `app`      | `environment`, `logLevel`                                                                             |
| `database` | `url`                                                                                                 |
| `web`      | `host`, `port`, `origin`                                                                              |
| `api`      | `host`, `port`, `corsOrigin`, `openapi.serverUrl`, optional `openapi.username` and `openapi.password` |
| `redis`    | `url`, `keyPrefix`, `connectTimeoutMs`                                                                |
| `storage`  | optional `bucket`, `accessKeyId`, `secretAccessKey`, `endpoint`; `region`, `rootPrefix`               |
| `realtime` | `publicUrl`, `host`, `port`, `corsOrigin`, `ticketSecret`, `internalUrl`, `publishApiKey`             |
| `worker`   | `notificationUrl`, `notificationApiKey`                                                               |
| `webhook`  | optional `secretEncryptionKey`                                                                        |

Only settings consumed by active code are migrated. Unused poll-interval and
example-schedule declarations do not create new runtime behavior. Existing
operational literals need not all become configurable in this migration.

Illustrative subset of the document:

```yaml
app:
  environment: "${NODE_ENV:-development}"
  logLevel: "${LOG_LEVEL:-info}"

database:
  url: "${DATABASE_URL}"

web:
  host: "${WEB_HOST:-0.0.0.0}"
  port: "${WEB_PORT:-4100}"
  origin: "${WEB_ORIGIN:-http://localhost:4100}"

api:
  port: "${API_PORT:-4101}"

realtime:
  publicUrl: "${REALTIME_URL:-http://localhost:4102}"
```

This subset is not a complete deployment config. The implementation supplies
the full document and `.env.example` for the canonical fields above.

Use `WEB_PORT` and `API_PORT` instead of ambiguous application-level `PORT`.
Keep `DATABASE_URL`, `REDIS_*`, `S3_*`, `REALTIME_*`,
`WORKER_NOTIFICATION_*`, `OPENAPI_*`, and
`WEBHOOK_SECRET_ENCRYPTION_KEY` where they map to existing semantics.
`REALTIME_URL` replaces `VITE_REALTIME_URL`; it is browser-reachable and distinct
from server-only `REALTIME_INTERNAL_URL`.

Operational defaults belong to YAML, not duplicated Zod defaults or hardcoded
launcher arguments. Zod owns validation and normalization. A default localhost
public URL is allowed for development only; production requires an explicit
nonempty `REALTIME_URL`. Secrets have no committed operational fallback.

## Loading and validation contract

1. Parse one YAML 1.2 document as an unknown object.
2. Check the document structure, known keys, and template grammar globally.
3. Select the fields required by the requested runtime or narrow adapter.
4. Resolve selected environment references once using an environment snapshot.
5. Validate and normalize the selected values through Zod 4.
6. Return a typed, non-mutated configuration owned by that process.

Reject multiple documents, duplicate keys, unknown keys at every object level,
wrong container shapes, custom executable tags, and aliases/anchors. No YAML
merge keys or includes are supported. The raw-document shape accepts native
scalar literals and string templates; runtime-value schemas apply final types.
Structural validation must not require resolving secrets belonging to another
process. Runtime field selection is explicit and reviewable.

### Interpolation

- `${NAME}` requires a defined, nonempty value.
- `${NAME:-fallback}` uses the fallback when undefined or empty.
- Names use uppercase environment identifier syntax.
- Interpolate values only; templated mapping keys are invalid.
- A fallback may be empty; the resulting empty string is handled by its schema.
- Templates do not nest and do not execute shell commands.
- Recognized references resolve once; inserted environment values are literal
  data, even when they contain `${...}`, YAML punctuation, or newlines.
- Reject malformed template syntax in the original document. Use `$${` to
  represent literal `${` in the original document, with no recursive expansion.
- Never substitute into the raw YAML text or parse substituted values as YAML.

### Value validation

- Ports are integers from 1 through 65535.
- Numeric string conversion first rejects empty/whitespace-only strings,
  booleans, null, and malformed numeric input; each field has explicit bounds.
- Boolean fields, if needed by existing consumers, accept YAML booleans or
  `z.stringbool` with only `true`/`false` tokens, case-insensitive. Do not use
  `z.coerce.boolean` or introduce new boolean settings solely for this design.
- Browser realtime URL accepts HTTP(S) Socket.IO origins, without URL credentials
  or fragments. HTTPS/TLS termination remains a deployment responsibility;
  this migration does not break the local Compose HTTP topology.
- Redis URLs accept `redis:`/`rediss:`. Database URLs retain Prisma-compatible
  PostgreSQL URL semantics and query options; do not impose a generic HTTP URL
  schema on database credentials.
- Optional secret fields normalize empty values only for those fields, never
  globally trimming passwords or silently turning required values optional.
- Preserve paired OpenAPI credentials, storage all-or-none credential checks,
  publisher credential pairing, and webhook-key validation. Enabled consumers
  still require the credentials their existing operations need.
- Preserve explicit isolated database/Redis safeguards in existing test adapters.

Errors identify the file, runtime, field path, and safe reason; missing-env errors
may name the variable. Never include resolved values, secrets, connection URLs,
whole config objects, or raw YAML source excerpts in errors sent to logs/client.

## Runtime ownership and lifecycle

| Consumer   | Required configuration                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Web server | app, web, database, storage, webhook; realtime public URL and ticket-signing secret                                    |
| API        | app, api, database, storage, webhook; worker notification key and realtime internal publisher pair when enabled        |
| Worker     | app, database, Redis, storage, worker notification settings; other fields only when an installed handler consumes them |
| Scheduler  | app and Redis; no database requirement or Prisma initialization                                                        |
| Realtime   | app, realtime listener/CORS, ticket verification and publisher secrets; no database requirement                        |
| Migrate    | database URL and execution environment only                                                                            |

Section selection alone is insufficient: selecting web's ticket secret must not
require realtime publisher credentials. A process must not receive another
process's secrets through a broad resolved object.

Create config after runtime environment loading and before resources/listeners
start. Cache a snapshot per process/runtime; restart/redeploy applies changes.
Do not evaluate secret-bearing config as a side effect of importing a module
during build. Shared pure schema/loader functions accept explicit input for
fixtures without using the process singleton.

`packages/db` remains the sole Prisma owner. Runtime code supplies its resolved
database URL explicitly to Prisma rather than treating mutated `process.env`
as the application configuration bus. Preserve the existing singleton and
development reuse pattern. Database initialization must occur after config
resolution; scheduler and realtime must not initialize it accidentally.

Allow narrowly scoped child-process environment adapters for Prisma CLI and
Nitro/listener tools that require `DATABASE_URL`, `PORT`, or `HOSTNAME`. Do not
export every config field into child environment or mutate global environment.
Framework-required variables and bootstrap reads are exceptions, not permission
for feature-level environment access.

Dev loads the repository-root `.env` explicitly, avoiding CWD-dependent discovery
and conflicting Bun/Vite mode resolution. Deployment uses injected process
environment without requiring a `.env` file. A child launcher must not reload
an unrelated `.env` after receiving its resolved tooling settings.

## Browser contract

Expose a same-origin public tRPC query `config.public`, with no caller input.
Its sole response is `{ realtimeUrl: string }`, validated by a strict Zod 4
output schema. Construct the response explicitly; do not return or spread a
server config object, filter env prefixes, or accept arbitrary config key names.

The value is deployment-wide and independent of cookies, user, workspace, or
database. Public config succeeds without session/database lookup, even when
cookies are present. Make session resolution lazy for authenticated procedures
or apply an equivalent explicit path that preserves every auth/permission gate.
Do not bypass authorization for other public, authenticated, or workspace routes.

Set `Cache-Control: no-store` on every response containing this query, including
batched responses and failures. No CDN cache, static extraction, prerendered
config response, or generated browser config file is allowed.

Fetch config using the existing tRPC client and TanStack Query. Deduplicate/cache
the successful value for the current page lifecycle; fresh page loads refetch.
Do not persist it to browser storage or service-worker caches. Realtime starts
only when both config and an authenticated ticket are available. Construct the
socket with an explicit URL argument; no config fetching inside the socket factory.
Dispose the old socket when dependencies change or the bridge unmounts.

While config/ticket is pending or failed, no socket connection starts. Existing
HTTP application use remains available. There is no client-side localhost
fallback or silent use of an obsolete URL. Preserve existing invalidation and
workspace join behavior; no visible UI redesign is part of this scope.

Ticket credentials stay in `auth.realtimeTicket`; ticket signatures, expiration,
and signing keys retain their current security contract. Public URL is public
data, not a secret merely because its environment name is server-only.

Remove all application deployment config from `VITE_*`, `PUBLIC_*`, Vite
`define`, and equivalent build-time browser injection. Built-in tooling constants
such as `import.meta.env.DEV`/`SSR` remain allowed. `apps/web/src/lib/config.ts`
retains its brand/presentation-default role and never becomes a secret loader.

## Zod 4 migration

Use one consistent direct Zod 4 version policy across project manifests. Registry
research observed 4.6.5; resolve a compatible stable Zod 4 release during
implementation and record the selected version in the lockfile. All resolved
`zod` packages must have major version 4. Do not use Zod 3 imports, compatibility
schemas, or blind overrides of dependencies requiring incompatible Zod APIs.

Audit all schemas, generic types, error handling, recipe source, and existing
fixtures. In particular inspect `ZodTypeAny`, input/output inference after
coercion, default/optional behavior, record exhaustiveness, URL/UUID/datetime
acceptance, and error issue APIs. Do not mechanically replace APIs with different
acceptance semantics. Preserve queue/event/ticket/search/tRPC contracts; security
validation cannot be weakened to make typecheck pass. An incompatible third-party
dependency is a blocker to reconcile, not a reason to leave Zod 3 installed.

Remove env-core when its project consumers have migrated. Keep the normal Zod 4
API; introducing Zod Mini, a validation wrapper package, or vendored dependency
code is not necessary for this work.

## Deployment and documentation

- Docker build cannot require real database/storage/realtime credentials or the
  deployment `REALTIME_URL`. Remove runtime config launch/validation from build.
- If Prisma generation requires a syntactic URL, use a non-secret tooling-only
  placeholder that is not baked into runtime environment or browser output.
- Package the single YAML file with runtime artifacts and make its resolution
  independent of source-directory layout changes after bundling.
- Use runtime listener configuration instead of hardcoded dev port arguments.
- Align Compose runtime variables with YAML names; distinguish browser-facing
  `REALTIME_URL` from container-network `REALTIME_INTERNAL_URL`.
- Existing Compose-only development service credentials are not promoted into
  production YAML defaults. Do not copy `.env` or real secrets into image layers.
- Update `.env.example`, README, applicable runbooks, architecture guards,
  `AGENTS.md`, `.agent/config.md`, and runtime guidance to the approved design.
- Preserve historical documents and unrelated work; do not modify real local
  `.env` values without separate approval.

## Acceptance requirements and verification

Implementation must satisfy all of the following:

1. One active YAML file, no modular fallback/merge launcher, and no env-core
   consumers in the new pipeline.
2. Parse-first, single-pass interpolation with the documented missing/empty,
   escape, optional-value, type, and secret-safe-error semantics.
3. Strict known-key validation and explicit per-runtime field isolation;
   scheduler/realtime/migrate do not require unrelated secrets. Scheduler and
   realtime do not initialize Prisma; migrate uses its existing Prisma CLI boundary.
4. Typed config is used by owners/consumers; only narrow tooling adapters emit
   environment variables. No runtime initialization during build imports.
5. `config.public` returns only `realtimeUrl`, requires no auth/database lookup,
   and sends no-store headers including batches/failures.
6. Browser realtime uses the fetched URL and separate authenticated ticket,
   with no client env, persistent config cache, or hidden connection fallback.
7. All project schemas and dependency resolution use Zod 4, preserving existing
   runtime contracts and security constraints.
8. Docker/Compose/launchers and active docs match runtime-only configuration.
9. Existing test sources are preserved and adapted, with focused fixtures for
   loader semantics, field isolation, output projection, auth isolation, cache
   headers, and Zod migration-sensitive contracts where applicable.

These are implementation requirements, not claims that typecheck proves them.
Follow `.agent/verification.md`: inspect source/config/lockfile and run fresh
repository-native typechecks for affected owners/consumers only. Preserve and
adapt tests, but do not execute system tests, migrations, builds, Compose,
containers, or backend services. Do not add Storybook work for an infrastructure
change with no presentation change. Report runtime interpolation, auth/cache,
socket, database, and Docker integrations as runtime-unverified.

Document-only delivery uses document consistency/formatting review, not runtime
checks. Implementation plan creation follows explicit user review of this file.

## Research references and limits

External references support the design but do not override local ownership or
verification rules:

- [YAML parser](https://eemeli.org/yaml/): YAML 1.2 parsing and strict key options.
- [Bun environment variables](https://bun.sh/docs/runtime/environment-variables):
  environment loading and explicit/disabled env-file support.
- [Vite environment variables](https://vite.dev/guide/env-and-mode): build-time
  client substitution and interaction with Bun env loading.
- [Zod 4 migration guide](https://zod.dev/v4/changelog): migration-sensitive APIs.
- [Zod API](https://zod.dev/api): strict objects, string booleans, input/output types.
- [tRPC validators](https://trpc.io/docs/server/validators): Zod/Standard Schema
  input/output validation.
- [T3 Env Core](https://env.t3.gg/docs/core): Standard Schema support; removal is
  simplification, not incompatibility.
- [TanStack server functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
  and [server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes):
  valid alternatives, not selected because the project already uses same-origin tRPC.

Latest upstream examples are not automatically valid for installed versions.
Typecheck and source review must use the repository's actual dependency graph.
