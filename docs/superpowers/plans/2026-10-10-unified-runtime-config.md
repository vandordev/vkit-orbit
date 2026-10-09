# Unified Runtime Configuration and Zod 4 Implementation Plan

> **For agentic workers:** Follow the execution mode selected at approval. Orchestrated modes use `/home/alfarizi/.config/opencode/workflows/planned-execution.md`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace modular environment configuration with one typed runtime YAML pipeline, eliminate browser deployment env, and migrate the entire project to Zod 4.

**Architecture:** `packages/config` parses one YAML document, validates its shape, selects explicit runtime fields, resolves templates once, and validates selected values with Zod 4. Consumers use cached typed config; Prisma construction and tRPC session resolution become lazy at their respective ownership boundaries. Browser realtime obtains only its URL through `config.public`, separate from authenticated tickets.

**Tech Stack:** Bun 1.4.2, TypeScript 5.9.2, YAML 1.2 via `yaml`, Zod 4, Prisma 6, TanStack Start/Query, tRPC 11, Elysia, Socket.IO, BullMQ, existing Docker/Compose packaging.

**Approved spec:** `docs/superpowers/specs/2026-10-10-unified-runtime-config-design.md`, approved by the user after commit `4b34aac`.

**Status:** Proposed plan awaiting user approval and execution/branch selection. No task is implemented by this document.

## Discovery Evidence

- Checkout: `main`, initially clean, two local commits ahead of `origin/main`; recheck before implementation and preserve user work.
- Root `package.json` defines `check-types` as `turbo run check-types`. `turbo.json` has only upstream `check-types` dependencies, not build/service prerequisites. Workspace check scripts inspected run `tsc --noEmit`.
- Confirmed fresh command: `bun --no-env-file run check-types --force`. A prior task ran all 16 available typecheck tasks successfully; this is historical evidence, not the implementation baseline.
- `packages/config/src/{loader,run,common,api,worker,scheduler,realtime,redis,storage,webhook,index}.ts` and adjacent tests establish the old interfaces. `packages/config/tsconfig.json` includes `src/**/*`.
- Nine observed config files: `config/{base,web,api,worker,scheduler,realtime,redis,storage,webhook}.yaml`.
- `packages/db/src/{client,index}.ts`, `packages/db/package.json`, and `packages/db/prisma/schema.prisma` establish singleton ownership. Generated `node_modules/.prisma/client/index.d.ts` includes `datasourceUrl?: string`; explicit URL configuration is supported by the installed client.
- `packages/application/src/shared/transaction.ts`, `packages/application/src/webhooks/secret.ts`, and `packages/query/src/index.ts` require lazy database and config call-site migration. Query adapters already allow injected clients.
- `apps/api/src/{lib/env,runtime,server}.ts`, `apps/{worker,scheduler,realtime,migrate}/src/main.ts`, and web server adapters reveal entrypoint/resource initialization.
- `apps/web/src/trpc/{context,init,client}.ts`, routers `auth.ts` and `index.ts`, and `apps/web/src/app/trpc/$.ts` establish the typed transport. `auth.status` depends on the existing eager session field; it must explicitly resolve the session after migration.
- Existing web tests: `apps/web/src/trpc/{authorization,transport,settings}.test.ts`. They use persistence substitutes; they do not prove a live database or deployed HTTP boundary.
- Existing schema tests: `packages/queue/src/contracts.test.ts`, `packages/realtime/src/{events,ticket,publisher}.test.ts`, and `apps/web/src/lib/{document-search,realtime}.test.ts`.
- Dockerfiles, `.dockerignore`, `docker-compose.yml`, `Taskfile.yml`, root/web scripts, `apps/web/vite.config.ts`, and `turbo.json` are packaging/launcher owners. `.dockerignore` excludes real `.env` files. Migration image currently copies only database-related package manifests; it needs the config dependency closure after migration.
- Current direct Zod 3 manifests: API, web, config, queue, realtime. Lockfile also contains Zod 4 for TanStack tooling. `@t3-oss/env-core` accepts Zod 4 as a peer, allowing it to remain briefly while internal consumers migrate.
- Research observed Zod 4.6.5. Task 1 confirms registry availability and transitive version compatibility without upgrading unrelated frameworks.
- No services, credentials, Docker, Redis, or database are needed for authorized verification. Existing generated Prisma types and installed dependencies are prerequisites for typecheck. If missing, report the typecheck blocker rather than running migrations/services/builds.

### Uncertainties and earliest resolution

| Question                                         | Resolve in     | Decision rule                                                                                                    |
| ------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Exact Zod transitive closure                     | Task 1         | Resolve only Zod 4; incompatible consumers block their migration, not unrelated config source work               |
| Zod 4 UUID/datetime/default semantic differences | Tasks 2–3      | Preserve existing queue/ticket/event/search contracts; reconcile explicitly rather than widening validation      |
| YAML structural/template schemas                 | Tasks 4–5      | One shared known-key shape plus explicit field selection; no internal Zod introspection                          |
| Bundled config path and listener launcher        | Tasks 6 and 12 | Resolve from trusted application root; runtime supplies root explicitly; never rely on bundled `import.meta.dir` |
| Import-triggered Prisma/config initialization    | Task 7         | Lazy getter and explicit URL; no Proxy-based Prisma facade or import-time config loading                         |
| tRPC no-store on batches/errors                  | Task 9         | HTTP adapter applies no-store before context/validation work for the transport, including early error responses  |

No newly established baseline defect is assumed. Run the fresh baseline before code changes; record any failures and their exact owners.

## Verification Architecture

Repository policy overrides installed skills recommending TDD execution or live integration tests. This is a system change with no presentation redesign.

| Requirement                            | Authorized evidence                                                          | Remaining unverified                                    |
| -------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- |
| Zod 4-only graph                       | Manifest/lockfile review; install without lifecycle scripts; fresh typecheck | Runtime parsing compatibility                           |
| YAML grammar, interpolation, redaction | Source review; authored fixtures; schema typecheck                           | Execution of fixtures and actual runtime inputs         |
| Runtime field isolation                | Explicit selector/schema review and typed consumers                          | Process boot and deployed secret isolation              |
| Lazy Prisma/session initialization     | Import/call-site review and consumer typecheck                               | Database access, authentication, concurrency            |
| Strict public projection/no-store      | Procedure/output schema and HTTP adapter review; fixtures; web typecheck     | Live HTTP, cache/proxy and batch behavior               |
| Socket lifecycle                       | Factory/bridge review and typecheck; fixture source                          | Browser/socket connections and reconnection             |
| Image portability                      | Docker/Compose/scripts/path review                                           | Image build, startup, differing deployment environments |

Actual integration boundaries are YAML/file/environment → process startup, HTTP → tRPC context/procedure, Prisma → PostgreSQL, and browser → Socket.IO. No fake or typecheck proves those live boundaries. They remain explicitly runtime-unverified; there is no mandatory external gate requiring prohibited verification.

Preserve/adapt existing tests and add focused contract fixtures where useful, but **do not run any system tests**. Do not start Storybook for this infrastructure-only work. Do not run builds, lint/full quality gates, migrations, Compose, containers, or service probes.

Dependency installation is setup, not verification: use `bun install --ignore-scripts`, followed by `bun install --ignore-scripts --frozen-lockfile` when the dependency graph is stable. Do not print environment contents. Document review and whitespace checks are allowed.

## Global Constraints

- One active default document: `config/config.yaml`; no compatibility fallback or YAML module merging at final delivery.
- All project-owned Zod usage and all resolved `zod` packages use major version 4; no `zod/v3`.
- `DATABASE_URL` is the only database input form. Prisma remains owned by `packages/db`.
- Parse YAML before interpolation; selected values resolve once in memory; no resolved config file or secret-bearing log/error.
- Strict known keys everywhere; no aliases/anchors, merge keys, includes, custom executable tags, or multiple YAML documents.
- `${NAME}`, `${NAME:-fallback}`, and `$${` escaping follow the approved spec; no nested templates or shell execution.
- Operational defaults live in YAML, not duplicated validators or launch arguments.
- Explicit runtime field subsets; scheduler/realtime have no database requirement or initialization.
- Browser response is exactly `{ realtimeUrl: string }`; no application client env; built-in Vite constants remain allowed.
- Public URL comes from `REALTIME_URL`, not `REALTIME_INTERNAL_URL`; production requires explicit nonempty `REALTIME_URL`, while local Compose HTTP remains supported.
- Public config does not resolve sessions/database; authenticated and workspace procedures preserve all existing security gates.
- No-store caching covers batches and failures; browser caches only within the current page lifecycle.
- No new features/flags, brand changes, contract version changes, schema migrations, runtime hot reload, or local-secret edits.
- No runtime config initialization during build/module imports; adapters emit only tool-required child environment settings.
- Follow `.agent/verification.md`: source review and fresh typecheck only for system implementation.
- Commit completed batches conventionally; no automatic merge, push, or branch deletion. Branch selection precedes execution.
- Scope locks are flexible unless stated otherwise. Record smallest supporting-path deviations and spec-preserving plan revisions without dropping requirements.

## File Structure and Interfaces

Expected new files:

- `packages/config/src/document.ts`: global known-key/raw-template validation.
- `packages/config/src/interpolation.ts`: grammar and single-pass resolution.
- `packages/config/src/errors.ts`: safe diagnostics without raw input values.
- `packages/config/src/paths.ts`: trusted application-root path resolution.
- `packages/config/src/runtime.ts`: explicit selectors, typed getters, process snapshot cache.
- `packages/config/src/public.ts`: browser-safe output schema/types only.
- `packages/config/src/web.ts`, `database.ts`, `tooling.ts`: web/database subsets and narrow launcher adapters.
- `config/config.yaml`: full declarative config replacing nine documents.
- `apps/web/src/server/public-config.ts`: explicit public projection.
- `apps/web/src/trpc/routers/config.ts`: `config.public` registration.
- `packages/config/src/{document,interpolation,runtime,public,tooling}.test.ts` and `apps/web/src/trpc/public-config.test.ts`: contract fixture sources, not executed gates.

Existing runtime adapter files remain cohesive schema owners. Replace their flat APIs once consumers move. `packages/config/src/index.ts` becomes server entrypoint; add explicit `@repo/config/server` and `@repo/config/public` exports. Root may temporarily re-export server API within implementation batches, but final browser access is only the public entrypoint or type-only imports.

Target interfaces (new proposed interfaces, not claimed to exist today):

```ts
type RuntimeName = "web" | "api" | "worker" | "scheduler" | "realtime" | "migrate";
type ConfigOptions = {
	filePath?: string;
	environment?: Readonly<Record<string, string | undefined>>;
};
type AppEnvironment = "development" | "staging" | "production" | "test";
type DatabaseConfig = { url: string; environment: AppEnvironment };
// runtimeSchemas supplies exact schema-inferred types for each runtime.
type RuntimeConfig<R extends RuntimeName> = z.output<(typeof runtimeSchemas)[R]>;
function loadRuntimeConfig<R extends RuntimeName>(runtime: R, options?: ConfigOptions): RuntimeConfig<R>;
function getRuntimeConfig<R extends RuntimeName>(runtime: R): RuntimeConfig<R>;
function getWebConfig(): RuntimeConfig<"web">;
function getApiConfig(): RuntimeConfig<"api">;
function getWorkerConfig(): RuntimeConfig<"worker">;
function getSchedulerConfig(): RuntimeConfig<"scheduler">;
function getRealtimeConfig(): RuntimeConfig<"realtime">;
function getDatabaseConfig(): DatabaseConfig;
function getPublicWebConfig(): { realtimeUrl: string };
function getWebhookConfig(): { secretEncryptionKey?: string };
function webToolEnvironment(config: Pick<RuntimeConfig<"web">, "web" | "app">): {
	PORT: string;
	HOSTNAME: string;
	NODE_ENV: AppEnvironment;
};
function prismaToolEnvironment(config: DatabaseConfig): {
	DATABASE_URL: string;
	NODE_ENV: AppEnvironment;
};
```

`getPublicWebConfig`, `getDatabaseConfig`, and `getWebhookConfig` are narrow cached selections from the same file, not separate files or broad runtime loads. Pure `loadRuntimeConfig` bypasses process cache for fixture inputs. `getPublicWebConfig` must not call `getWebConfig` because full web config requires database/ticket secrets.

Normalized storage remains `StorageConfig | null`, matching `createStorageClient` input. Redis retains `maxRetriesPerRequest: null` for existing BullMQ adapters; that invariant belongs to the consumer adapter, not YAML. Existing app environment enum and credential pairings are preserved.

---

## Execution Batches

Only the final batch owns the full-plan audit and repository-wide integrated gate. Intermediate batches may temporarily retain old internal APIs to keep consumers compiling; this is sequencing, not a shipped compatibility mode. No intermediate partial state is called full-spec completion.

### Batch 1: One Zod 4 dependency and contract baseline

- Goal: Resolve Zod 4-only dependencies and migrate project schema consumers without changing payload/security contracts.
- Tasks: 1–3.
- Depends on: None.
- Acceptance gate: Graph/source review and `bun --no-env-file run check-types --force`; no cached tasks count as fresh evidence.
- External gates: `GATE-ZOD-REGISTRY` blocks Task 1 dependency resolution and version-sensitive Tasks 2–3 if registry access/dependency availability fails. Source: registry and Bun install output; owner: package registry/network; resolution: compatible Zod 4-only graph installed without lifecycle scripts. Config source design can continue independently but its Zod 4 typecheck remains blocked until resolved.
- Verification impact: Dependency/schema changes invalidate all prior typechecks; existing runtime contracts remain unexecuted.

### Batch 2: Single-file typed configuration core

- Goal: Deliver parse-first YAML loading, strict templates, isolated runtime schemas, and lazy typed getters.
- Tasks: 4–6.
- Depends on: Batch 1 Zod availability.
- Acceptance gate: Core/fixture source review and `bun --no-env-file run check-types --force --filter=...@repo/config`.
- External gates: None; missing installed/generated types are reported as typecheck blockers, not permission to generate/build.
- Verification impact: Config exports/manifests invalidate config and dependent typechecks. Old launchers remain only until Task 12 cutover.

### Batch 3: Lazy database ownership and typed server consumers

- Goal: Remove import-time Prisma construction and migrate all server consumers without widening their configuration needs.
- Tasks: 7 (one-task batch: high-risk cross-owner database initialization and usecase wiring).
- Depends on: Batch 2.
- Acceptance gate: Complete value-import/call-site audit and `bun --no-env-file run check-types --force --filter=...@repo/db --filter=...@repo/config`.
- External gates: None. PostgreSQL/Redis runtime integration remains unverified, not a blocking live gate.
- Verification impact: Database exports and consumer wiring invalidate API, application, query, web, worker typechecks and previously reviewed initialization paths.

### Batch 4: Public runtime config without client env

- Goal: Fetch the public URL over tRPC without session/database work and connect realtime only after config/ticket readiness.
- Tasks: 8–10.
- Depends on: Batches 2–3.
- Acceptance gate: Security/projection/cache/bridge source audit and `bun --no-env-file run check-types --force --filter=web`.
- External gates: None; HTTP/auth/socket integrations remain runtime-unverified.
- Verification impact: Context/procedure changes invalidate all auth/workspace fixtures and web typecheck; factory changes invalidate realtime consumer fixtures.

### Batch 5: Packaging cutover and integrated audit (Final)

- Goal: Remove all old configuration paths, align deployment/docs/guards, and reconcile every approved requirement.
- Tasks: 11–13.
- Depends on: Batches 1–4.
- Acceptance gate: Task 13 full-spec audit, manifest/lockfile/launcher review, and `bun --no-env-file run check-types --force` across the repository.
- External gates: None. Docker builds/services/tests remain explicitly outside authorized verification.
- Verification impact: Package exports/launchers/dependency removal can invalidate every earlier typecheck and path review; rerun the final integrated typecheck after the last code change.

Gate statuses are `PASS`, `FAIL`, `BLOCKED`, or `SKIPPED`. Only fresh successful typecheck plus required source review yields `PASS` for an authorized gate. Never label prohibited runtime checks as passes; record them as runtime-unverified. A blocked required typecheck prevents batch completion.

## Task Details

### Task 1: Resolve one Zod 4 graph

**Files:** Modify the five direct-Zod manifests, root `package.json` only if a justified version-consistency mechanism is needed, and `bun.lock`. Scope lock: flexible.

**Interfaces:** Consumes existing dependency graph. Produces a compatible Zod 4-only graph. Blocked by `GATE-ZOD-REGISTRY` only if dependency access fails.

- [ ] Inspect branch/tree, instructions, and run `bun --no-env-file run check-types --force` as a fresh baseline. Record failures without attributing them to this work.
- [ ] Confirm the selected stable Zod 4 version and locked consumers; use the same direct declaration in all five manifests, for example `"zod": "^4.6.5"` if that observed release remains compatible. Do not bump tRPC/TanStack/Elysia wholesale.
- [ ] Run setup `bun install --ignore-scripts`; inspect every locked Zod package version. Use the real dependency requirements to reconcile any incompatible consumer; do not force v4 into a v3-only peer/API.
- [ ] Inspect installed declarations for migration-sensitive generics and validators. Carry compilation repairs into Tasks 2–3 before closing this batch.

**Evidence:** Manifest/lockfile review and final Batch 1 typecheck. Runtime schema acceptance remains unverified. Any manifest/lockfile edit invalidates this evidence.

### Task 2: Migrate queue, realtime, and recipe schema contracts

**Files:** `packages/queue/src/contracts/types.ts`, `maintenance-v1.ts`, `contracts.test.ts`; `packages/realtime/src/{events,ticket}.ts` and their tests; recipe schema sources under `recipes/realtime-notification` and `recipes/worker-provider-reliability`. Scope lock: flexible; job/event/ticket contracts are exact.

**Interfaces:** Consumes Zod 4. Produces existing job names, inferred payload output types, realtime events, and ticket claims unchanged. Blocked by Task 1 graph.

- [ ] Replace the queue generic constraint with the supported public Zod 4 base type, preserving schema output inference:

```ts
export type JobContract<T extends z.ZodType = z.ZodType> = {
	name: string;
	queue: "documents" | "webhooks" | "notifications";
	schema: T;
};
```

- [ ] Audit strict payloads and maintenance default `limit: 100`; preserve empty-object/default and unknown-key behavior, without changing `.v1` names.
- [ ] Compare UUID/datetime validation against existing event/ticket fixtures and documented acceptance. Do not blindly substitute `z.uuid()`/`z.iso.datetime()` if that changes accepted wire values. Keep signature/expiration checks intact.
- [ ] Adapt fixture sources to assert valid/invalid claims, extra fields, numeric revision, defaults, signature corruption, expiry, and existing event literals. Do not execute them.
- [ ] Update recipe schemas/imports to Zod 4 APIs without expanding recipe or runtime ownership.

**Evidence:** Contract/source review, fresh Batch 1 typecheck. Any schema/ticket implementation change invalidates the review.

### Task 3: Migrate config, API, and web schemas to Zod 4

**Files:** `packages/config/src/*.ts`; Zod consumers in `apps/api/src` and `apps/web/src/{trpc,lib/document-search.ts}`; existing adjacent tests. Scope lock: flexible.

**Interfaces:** Consumes Task 1 graph; preserves current interfaces while preparing their replacement in Batch 2. Blocked by Task 1 only; independent of Task 2 source editing.

- [ ] Audit `z.record`, defaults/optionals, coercion input types, removed error aliases, enum APIs, and schema generics across all project source. Use `.issues`, public Zod 4 APIs, and explicit key/value records where required.
- [ ] Preserve search pagination bounds/defaults, auth password requirements, scope validation, and credential pair checks. Do not normalize with `any`, unsafe casts, or relaxed schemas.
- [ ] Keep env-core temporarily only because old config consumers remain. Confirm its locked peer declaration supports Zod 4; final removal belongs to Task 12.
- [ ] Update schema fixture sources for altered type/error representations while preserving expected runtime contracts.
- [ ] Run `bun --no-env-file run check-types --force`, review the graph for no Zod 3, and commit Batch 1: `refactor: migrate validation contracts to Zod 4`.

**Evidence:** Fresh repository typecheck plus graph/contract audit. Fixture execution remains unverified.

### Task 4: Strict YAML document and single-pass interpolation

**Files:** Rewrite `packages/config/src/loader.ts`; create `document.ts`, `interpolation.ts`, `errors.ts`; adapt `loader.test.ts`, create `document.test.ts`, `interpolation.test.ts`. Scope lock: flexible.

**Interfaces:** `loadConfigDocument(filePath: string): RawConfigDocument`; `validateConfigDocument(value: unknown): RawConfigDocument`; `interpolateSelected(value: unknown, environment: Readonly<Record<string,string|undefined>>, diagnostic: { filePath: string; runtime: string }): unknown`. This task defines and exports `RawConfigDocument` from the canonical raw schema; Task 5 consumes it for selectors rather than duplicating field lists.

- [ ] Define strict object shapes for every canonical namespace, accepting appropriate literal scalars or strings/templates. Check all original template grammar without resolving variables. Add the new document loader alongside the old `loadConfig` implementation initially; old launcher/test imports stay compilable until Task 12 removes them. New loaders never fall back to old modules.
- [ ] Parse via `parseDocument` with YAML 1.2, `uniqueKeys: true`, string keys, and tracked errors; explicitly reject aliases/anchors, merge keys, unsupported tags and multiple documents before conversion. Do not emit parser errors containing raw source excerpts.
- [ ] Implement one scanner for `${NAME}`, `${NAME:-fallback}`, and `$${` literals. Scan original strings once and append inserted environment strings verbatim; do not run a second replacement/parser over the output. Resolve values, never keys.
- [ ] Build path-aware diagnostics containing only runtime/file/path/env-name and safe reason. Never serialize Zod input values or whole YAML/config into errors.
- [ ] Author fixture assertions for missing/empty fallback, literal escaping, malformed/nested references, environment values containing `${NEXT}`/newlines/`#`, duplicate/unknown keys, arrays, wrong containers, and forbidden YAML features. Example fixture expectation:

```ts
const diagnostic = { filePath: "/fixture/config.yaml", runtime: "web" };
expect(interpolateSelected("${PASSWORD}", { PASSWORD: "x:#\n${NEXT}" }, diagnostic)).toBe("x:#\n${NEXT}");
expect(interpolateSelected("$${PASSWORD}", {}, diagnostic)).toBe("${PASSWORD}");
```

**Evidence:** Source/fixture review and Batch 2 typecheck. Parsing and error execution remain unverified; Task 5 schema edits invalidate document review.

### Task 5: Canonical YAML and isolated runtime schemas

**Files:** Create `config/config.yaml`, `packages/config/src/{web,database,public}.ts`; rewrite common/API/worker/scheduler/realtime/Redis/storage/webhook schemas; create/adapt runtime/schema tests. Old YAML is removed only at final cutover. Scope lock: flexible.

**Interfaces:** `runtimeSchemas` keyed by the six runtime names, exported schema-inferred config types; `publicWebConfigSchema` and `PublicWebConfig`; explicit raw selectors for runtime and narrow database/public/webhook subsets. Blocked by Task 4 parser contract and Zod graph.

- [ ] Populate the complete canonical namespaces/fields from the approved spec. Use `WEB_PORT`/`API_PORT`; retain existing `S3_*`, `OPENAPI_*`, Redis and secret names. Supply defaults only in YAML. No new flags or unused polling behavior.

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
  host: "${API_HOST:-0.0.0.0}"
  port: "${API_PORT:-4101}"
  corsOrigin: "${CORS_ORIGIN:-http://localhost:4100}"
  openapi:
    serverUrl: "${OPENAPI_SERVER_URL:-http://localhost:4101}"
    username: "${OPENAPI_BASIC_AUTH_USERNAME:-}"
    password: "${OPENAPI_BASIC_AUTH_PASSWORD:-}"
redis:
  url: "${REDIS_URL:-redis://localhost:6379}"
  keyPrefix: "${REDIS_KEY_PREFIX:-dph:}"
  connectTimeoutMs: "${REDIS_CONNECT_TIMEOUT_MS:-5000}"
storage:
  bucket: "${S3_BUCKET:-}"
  region: "${S3_REGION:-us-east-1}"
  accessKeyId: "${S3_ACCESS_KEY_ID:-}"
  secretAccessKey: "${S3_SECRET_ACCESS_KEY:-}"
  endpoint: "${S3_ENDPOINT:-}"
  rootPrefix: "${S3_ROOT_PREFIX:-uploads}"
realtime:
  publicUrl: "${REALTIME_URL:-http://localhost:4102}"
  host: "${REALTIME_HOST:-0.0.0.0}"
  port: "${REALTIME_PORT:-4102}"
  corsOrigin: "${REALTIME_CORS_ORIGIN:-http://localhost:4100}"
  ticketSecret: "${REALTIME_TICKET_SECRET}"
  internalUrl: "${REALTIME_INTERNAL_URL:-}"
  publishApiKey: "${REALTIME_PUBLISH_API_KEY:-}"
worker:
  notificationUrl: "${WORKER_NOTIFICATION_URL:-http://localhost:4101/internal/worker-events}"
  notificationApiKey: "${WORKER_NOTIFICATION_API_KEY:-}"
webhook:
  secretEncryptionKey: "${WEBHOOK_SECRET_ENCRYPTION_KEY:-}"
```

Optional-empty templates do not make realtime publisher or worker credentials
optional when those consumers require them: their selected Zod schema enforces
that requirement. API publication retains its existing paired optional mode.
The OpenAPI default reflects the standalone API port 4101; web origin stays 4100.
Field selectors preserve raw provenance for production explicit-env requirements
and test Redis/database isolation, rather than validating only fallback output.

- [ ] Define port/numeric schemas that reject null/boolean/whitespace before conversion; use strict objects and native-or-`z.stringbool({ truthy: ["true"], falsy: ["false"] })` only if a migrated active setting needs booleans.
- [ ] Preserve storage optional/all-or-none behavior, paired OpenAPI credentials, API notification/publisher triple, webhook 64-hex key, Redis protocol/prefix isolation, and production explicit database requirements. Production public URL requires explicit `REALTIME_URL`; do not impose HTTPS-only on local Compose.
- [ ] Define explicit field selection: web receives public URL/ticket secret, not publisher credentials; worker receives no realtime secret, but selects the optional webhook encryption key used by installed delivery handlers; scheduler app/Redis only; realtime has no database/public URL requirement; migrate database/environment only. Narrow public selection is app environment plus public URL, not full web runtime. Export `AppEnvironment` and `DatabaseConfig` from the shared pure schema module for the target interface types.
- [ ] Create the public output schema as a standalone browser-safe unit:

```ts
const realtimeOriginSchema = z.url().refine((value) => {
	const url = new URL(value);
	return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.hash && !url.search && url.pathname === "/";
});
export const publicWebConfigSchema = z.strictObject({ realtimeUrl: realtimeOriginSchema });
export type PublicWebConfig = z.output<typeof publicWebConfigSchema>;
```

- [ ] Add fixtures for missing unrelated secrets, production explicit URL, valid HTTP local URL, URL credentials/fragments, partial storage/publisher pairs, wrong ports and typo keys. Keep required operation credentials required at their existing operation boundary.
- [ ] Keep old flat adapters compiling alongside new nested schemas until Task 7 migrates consumers and Task 12 removes obsolete exports. Do not redirect old callers into new incompatible return shapes mid-batch. This temporary internal sequencing never adds legacy fallback to the new pipeline.

**Evidence:** Explicit subset mapping, schema output inference, fixture source review, Batch 2 typecheck. No runtime execution or build proof.

### Task 6: Lazy getters, trusted paths, and entrypoint boundaries

**Files:** Create `packages/config/src/{runtime,paths,tooling}.ts`; modify `index.ts`, package exports; create `runtime.test.ts`, `public.test.ts`, `tooling.test.ts`. Scope lock: flexible.

**Interfaces:** Implements the target getters/loaders plus `webToolEnvironment` and `prismaToolEnvironment` in File Structure, restricted to each tool's accepted settings. Blocked by Tasks 4–5.

- [ ] Resolve config from a trusted application root supplied by bootstrap, with repository-root discovery for source development and explicit deployed root for bundled artifacts. Use `config/config.yaml`, not caller CWD or bundled source-relative paths. Keep explicit fixture `filePath` input.
- [ ] Cache the parsed document/environment snapshot and selected outputs only on first runtime use or bootstrap initialization; importing exports must not read files/env or initialize resources. Pure loader calls with explicit inputs do not share global cache.
- [ ] Implement the six typed runtime getters plus narrow public/database/webhook getters. Use an explicit schema/selector map; do not inspect Zod internals or return a broad `Record<string, unknown>` to consumers.
- [ ] Add package exports for server/public separation; public entrypoint contains only client-safe schema/types. Preserve old internal exports only until Tasks 7/12 migrate all consumers; do not introduce old-format fallback in new getters.
- [ ] Define child tool adapters, not a generic flatten function. Web/Nitro emits listener `PORT`/`HOSTNAME`; Prisma CLI emits only resolved `DATABASE_URL` and necessary execution environment. Inherit parent environment for process operation without injecting every resolved secret/config field.
- [ ] Author fixtures for deterministic input, cache lifetime, import-side-effect absence, trusted paths, public/server import closure and tooling field allowlist. Run Batch 2 typecheck; commit `feat: add unified typed runtime configuration core`.

**Evidence:** Config/dependent fresh typecheck and import/path/selection review. Bundled path behavior remains runtime-unverified.

### Task 7: Lazy Prisma and typed server-runtime cutover

**Files:** `packages/db/src/{client,index}.ts`, db manifest/tests; all value imports of Prisma in application/query/API/web/worker; `packages/application/src/{shared/transaction,webhooks/secret}.ts`; API env/runtime/server/logging plugins; worker/scheduler/realtime/migrate entrypoints; web storage/ticket adapters; relevant manifests/fixture sources. Scope lock: flexible; database ownership/security behavior exact.

**Interfaces:** `getPrisma(): DatabaseClient` and `createDatabaseClient(input: { url: string; environment: AppEnvironment }): DatabaseClient` remain owned by db. Type-only db exports remain available. Consumes narrow database getter and runtime config types from Task 6. Blocked by Batch 2; one high-risk complete owner/consumer migration.

- [ ] Add db → config dependency (config never imports db). Replace exported import-time Prisma value with a lazy singleton getter using explicit `datasourceUrl`, existing logging, and development global reuse. Do not use a Proxy to simulate the old value.

```ts
export function createDatabaseClient(input: DatabaseConfig): DatabaseClient {
	return new PrismaClient({
		datasourceUrl: input.url,
		log: input.environment === "development" ? ["warn", "error"] : ["error"],
	});
}
```

- [ ] Enumerate every `@repo/db` value import and dynamic `.prisma` read. Change usecases/query adapters to call `getPrisma()` inside execution, retaining explicit injected clients/transactions. No top-level `const prisma = getPrisma()` in imported feature modules.
- [ ] Update the current tRPC context to call `getPrisma()` only inside request context creation for intermediate compilation; Task 8 then removes even request-time database initialization from base context. Batch 3 does not claim public config isolation before Task 8.
- [ ] Update the transaction helper's type references without moving Prisma construction outside db. Preserve transactional and authorization behavior; do not propagate preexisting unsafe types into new interfaces.
- [ ] Replace feature `process.env` config reads with typed getters. Web ticket code reads only ticket config, storage code uses normalized storage, webhook crypto uses the narrow optional key getter and retains its operation-specific failure.
- [ ] Change API env/runtime/logger access to typed lazy getters so imports do not eagerly resolve config/resources. Publisher configuration remains optional with all-or-none credentials; full API validates at bootstrap before listen.
- [ ] Initialize worker/scheduler/realtime config at bootstrap; preserve lifecycle, shutdown, queue configuration, scheduler enqueue-only behavior, realtime authorization behavior and notification signing. Add `import.meta.main` guards where imports currently start a service.
- [ ] Migrate `apps/migrate` to config dependency and a narrowly scoped Prisma child environment without changing schema/migrations. Do not run it. Ensure migrate selects no Redis/storage/realtime configuration.
- [ ] Adapt database and consumer test-source imports/fixtures to the lazy API. Review import closures for no database initialization in scheduler/realtime/public-config imports. Run Batch 3 typecheck and commit `refactor: consume typed runtime config with lazy database initialization`.

**Evidence:** Full import/call-site audit and fresh typecheck. No DB/auth/service integration claims. Any db export, config selection, or consumer change invalidates this gate.

### Task 8: Lazy tRPC session and authenticated database context

**Files:** `apps/web/src/trpc/{context,init}.ts`, `routers/auth.ts`, `authorization.test.ts`, `settings.test.ts`; create context fixtures if needed. Scope lock: flexible; authorization exact.

**Interfaces:** Base `TRPCContext` exposes `req`, `responseHeaders`, `getSession(): Promise<Session|null>` and `getDatabase(): DatabaseClient`; authenticated middleware enriches ctx with nonnull `session` and database. `Session` derives from the actual `authenticateSession` return type. Blocked by Task 7 lazy db.

- [ ] Build base context without reading cookies through DB or creating Prisma. Memoize the session promise per request so concurrent batched procedures share one lookup; errors preserve current invalid-session handling.
- [ ] In authenticated middleware await `getSession`, reject null with `UNAUTHORIZED`, then attach `getDatabase()` and nonnull session. Keep workspace membership and permission checks in their existing middleware order.
- [ ] Update `auth.status` to await `getSession()` explicitly; `auth.me`, ticket, sign-in and register behavior remain unchanged. Public config never calls either lazy accessor.
- [ ] Adapt existing authorization/settings contexts to explicit lazy methods and add source fixtures asserting no invocation for an unrelated public procedure and once-only concurrent session lookup.

```ts
const session = await ctx.getSession();
if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
return next({ ctx: { ...ctx, session, database: ctx.getDatabase() } });
```

**Evidence:** Middleware/type review and web typecheck. Live authorization/concurrency remains unverified. Task 9 context changes invalidate fixtures.

### Task 9: Strict public query and HTTP no-store boundary

**Files:** Create `apps/web/src/server/public-config.ts`, `src/trpc/routers/config.ts`, `src/trpc/public-config.test.ts`; modify router index and `src/app/trpc/$.ts`. Scope lock: flexible.

**Interfaces:** `getPublicConfig(): PublicWebConfig` delegates to the narrow server getter; router adds `config.public` with `.output(publicWebConfigSchema)`. No new file-route path, so no generated route-tree changes are needed. Blocked by Task 6 getter and Task 8 context.

- [ ] Construct only `{ realtimeUrl }`; import config server implementation only in server code. Never expose a raw runtime config object or caller-selectable key.
- [ ] Register the public query using the existing public procedure and strict output validation:

```ts
export const configRouter = router({
	public: publicProcedure.output(publicWebConfigSchema).query(() => getPublicConfig()),
});
```

- [ ] Apply `Cache-Control: no-store` at the web tRPC HTTP adapter for all tRPC responses, a conservative cache policy already appropriate for authenticated APIs. This avoids depending on procedure execution for batch/error headers. Preserve context response headers/cookies and same-origin checks. Make early same-origin/adapter errors produce safe no-store responses without leaking config/parser errors.
- [ ] Add fixture sources for exact keys, cookie-bearing public query without auth/db accessor invocation, server projection failure, invalid input rejection, mixed batch, failed batch and same-origin failure headers using the real fetch tRPC adapter where possible. Fixtures may substitute config/persistence but must not be described as live deployed proof.
- [ ] Review responseMeta/header merge order so no-store cannot be overwritten by other batch procedures. Config/public errors sent to browser are generic; internal safe diagnostics stay server-side.

**Evidence:** Output/context/adapter review and web typecheck. Live HTTP/cache/proxy and cookies remain runtime-unverified.

### Task 10: Browser URL query and socket dependency injection

**Files:** `apps/web/src/lib/{realtime,realtime.test}.ts`; `apps/web/src/app/_authenticated/app/-components/realtime-bridge.tsx`; add bridge controller fixture if needed. Scope lock: flexible; no visible design changes.

**Interfaces:** `createRealtimeSocket(input: { url: string; ticket: string }): Socket`; bridge consumes `trpc.config.public.query()` and existing ticket query. Blocked by Task 9 router type.

- [ ] Replace `import.meta.env.VITE_REALTIME_URL` in the factory with the explicit URL argument, preserving `/ws`, websocket transport, ticket auth and `autoConnect: false`.
- [ ] Add config query with stable key `["runtime-config"]`, `staleTime: Infinity`, `gcTime: Infinity`, and `refetchOnWindowFocus: false`; the existing in-memory QueryClient is the cache, with no persistence. Enable the query only in the browser lifecycle to prevent server-build/prerender requests; do not introduce a root build-time loader. Query retries retain the existing bounded policy and never initiate a socket while the query is errored.
- [ ] Gate the effect on both successful config/ticket results and current non-error state. On pending/failure create no socket; retain HTTP functionality and no hidden URL fallback. Include URL/ticket/workspace in dependencies so changed values dispose the prior socket.
- [ ] Preserve invalidation listeners, authenticated workspace join and cleanup. Extend source fixtures for not-ready/error/ready/replacement/unmount behavior using an isolated controller if extracting one improves reviewability; no new UI presentation.
- [ ] Run Batch 4 web typecheck and commit `feat: load public realtime configuration through tRPC`.

**Evidence:** Bridge/factory source review and web typecheck; browser and Socket.IO runtime remain unverified.

### Task 11: Guardrails and fixture source reconciliation

**Files:** `scripts/check-architecture.ts` and tests, `scripts/check-public-bundles.ts` and tests; `packages/config/src/*.test.ts`; affected API/worker/scheduler/realtime/database/query test sources; recipe contract sources. Scope lock: flexible.

**Interfaces:** Existing guard APIs remain stable. Recognize `@repo/config/public` as client-safe, but continue forbidding root/server config in client code. Blocked by Tasks 1–10 interfaces; independent of Docker editing in Task 12.

- [ ] Update architecture source checks to reject application-specific browser env/define injection, root/server config imports and scheduler db access while allowing public-schema/type-only access and built-in Vite constants.
- [ ] Extend guard fixture sources with positive public-entrypoint examples and negative server-entrypoint/Zod 3/client-env examples. Do not blindly whitelist all `@repo/config/*` imports.
- [ ] Keep public-bundle checks for filesystem/credentials/server modules; adjust only explicit public-entrypoint naming false positives. No output build or guard test execution is authorized.
- [ ] Adapt old config module-launch and flat-env test fixtures to the new API. Preserve meaningful checks rather than deleting assertions to remove compiler failures. Do not execute integration harnesses.
- [ ] Inventory all remaining old config API/import usages in fixtures, smoke sources, recipes, docs and launchers; assign source usages to this task and operational launch usages to Task 12. Historical docs remain intact.

**Evidence:** Guard/fixture source review; Task 13 integrated typecheck. Changed guard implementation is not proven by unexecuted fixtures.

### Task 12: Full launcher and deployment cutover

**Files:** All six Dockerfiles, `docker-compose.yml`, `.dockerignore` if necessary, root/app package scripts, `Taskfile.yml`, `turbo.json`, `apps/web/vite.config.ts`, `packages/config/src/run.ts`, config manifest/index, `.env.example`, Docker/deployment test sources. Delete the nine old YAML documents only after their active references migrate. Scope lock: flexible; no local `.env` edits.

**Interfaces:** Replace `--modules` with explicit runtime/tool launcher selection or direct runtime entrypoints; launcher gets trusted application root and narrow child env. Consumes Tasks 6–7. Blocked by all consumers migrating away from old API.

- [ ] Rewrite launcher CLI to choose runtime/tool purpose, load only required config, and pass only required tool settings. Example target shape: `run.ts --runtime web -- bun .output/server/index.mjs`; Prisma uses migrate subset, not full application config. This replaces rather than preserves module CLI compatibility.
- [ ] Development scripts load root `.env` explicitly; deployed scripts/CMD rely on injected environment and `--no-env-file`. Child processes cannot auto-reload another `.env`. Vite receives the resolved web listener host/port without hardcoded `--port 4100`; production Nitro gets its narrow listener environment.
- [ ] Build scripts do not call runtime config launcher, require deployment URL or real secrets, or resolve public config. Remove deploy-specific config from Turbo build hashing/injection; preserve execution flags needed for non-build dev processes. Do not change framework/router versions.
- [ ] Docker packages the single YAML and supplies deployed `/app` root explicitly. Update migrate prune/copy/install dependency closure for config/Zod/YAML. Remove runtime database build args/ENV; if Prisma generation needs a syntactic URL, scope a non-secret placeholder to that generation command only. Never run the build.
- [ ] Compose uses `WEB_PORT`, `API_PORT`, `REALTIME_URL`, and distinct internal publisher URL. Keep local service ports/health references coherent with existing mappings; remove scheduler database env/dependency where it served only obsolete config needs, without changing queue behavior. Update `.env.example` and do not migrate real developer secrets automatically.
- [ ] Delete old modular YAML, flat loader exports, `publicConfigEnvironment`, `resolvedConfigEnvironment`, and env-core dependency after source migration. No fallback clients/launchers remain. Remove obsolete module/poll declarations rather than adding unused settings.
- [ ] Run dependency setup without scripts and frozen lockfile confirmation. Inspect graph for Zod 4 only and no env-core. Review deployment fixture expectations, preserving their meaningful image/Prisma ownership checks without execution.

**Evidence:** Packaging/graph/source review; final typecheck. Docker build/startup, Prisma CLI and Vite/Nitro listener execution remain unverified. This task invalidates all prior dependency/path evidence.

### Task 13: Active documentation, full-spec audit, and final gate

**Files:** `README.md`, `AGENTS.md`, `.agent/{config,architecture,database,backend-typescript}.md`, relevant web guidance/runbooks where references exist; this plan and an execution ledger created at `docs/superpowers/plans/2026-10-10-unified-runtime-config-execution.md`. Scope lock: flexible; root workspace alignment files and historical specs/plans are excluded.

**Interfaces:** Final contract as specified; no new behavior. Blocked by Tasks 1–12.

- [ ] Update active docs to one YAML, Zod 4, per-runtime typed getters, explicit tooling exception, public tRPC URL, restart/redeploy lifecycle, server/public import separation and no client deployment env. Retain brand and typecheck-only verification ownership.
- [ ] Record task/batch status, commits, commands/results, source audits, revisions and unverified boundaries in the execution ledger. Every task has exactly one owning batch; no unmet requirement is relabeled complete.
- [ ] Perform the requirement audit below against actual code, dependency graph, launchers and docs. Search for old modules/APIs, env-core, direct feature env reads, import-time config/Prisma initialization, client env/injection and Zod 3. Classify historical references separately rather than editing them globally.
- [ ] Confirm listener/config path handling for source and bundled deployment by source review. Review copy/install closures and `.dockerignore` without building an image or reading real secrets.
- [ ] Inspect current check scripts for service/build hooks, then run `bun --no-env-file run check-types --force` after the last implementation edit. Expected: every actual `check-types` task succeeds uncached. Missing/generated/dependency errors block completion; do not substitute prohibited commands.
- [ ] Check changed-file whitespace/document formatting, review diff and commit `refactor: complete unified runtime configuration cutover` after authorized gates pass. Report exact evidence, clean/dirty state and runtime-unverified integration boundaries; no push/merge.

**Evidence:** One final repository-wide typecheck plus full-spec/source/document audit. This is not proof of image portability, parser correctness, deployed cache/auth, DB or socket behavior. A subsequent code/manifest/config change invalidates affected audit/typecheck evidence.

## Requirement Coverage Audit

| Spec requirement                               | Owning tasks | Final evidence                                        |
| ---------------------------------------------- | ------------ | ----------------------------------------------------- |
| One YAML/no compatibility/env-core removal     | 4–6, 12      | File/API/import/graph audit                           |
| Strict parsing/templates/escaping/redaction    | 4–5          | Implementation and fixture source review              |
| Runtime isolation and narrow subsets           | 5–7          | Selectors/types/import closure review                 |
| Cached lazy configuration and trusted paths    | 6–7, 12      | Bootstrap/path/copy closure review                    |
| Explicit URL Prisma singleton                  | 7            | db constructor/getter and consumer typecheck          |
| Public projection and no DB/session lookup     | 8–9          | Context/output schema review and web typecheck        |
| Preserve authenticated/status/workspace gates  | 8            | Middleware/status source audit and fixture types      |
| No-store including mixed batches/failures      | 9            | Adapter/header/error ordering review                  |
| No client env, socket readiness/cleanup        | 10–12        | Browser source/guard/script review                    |
| Entire project Zod 4, unchanged contracts      | 1–3, 11–12   | Manifest/lockfile/source audit and typecheck          |
| Build/runtime separation; Docker/Compose/env   | 12           | Deployment source review; runtime unverified          |
| Active docs/tests preserved; no extra features | 11, 13       | Diff/source/doc review                                |
| Authorized final integrated gate               | 13 only      | Fresh repository typecheck and honest evidence ledger |

## Plan Revision and Handoff

Paths, equivalent typecheck forms, decomposition, and implementation details may be revised without new product approval only when they preserve the approved spec. Record evidence, rationale, old/new task/batch mapping, coverage and invalidated checks in this plan and ledger. Keep exactly one final audit batch. Changes to product/security contracts, spec requirements, branch, execution profile, destructive scope or external authority require applicable user approval.

Do not launch an execution session or alter code until plan approval and execution/branch selection. After approval offer exactly: execute inline, Mars direct on Luna High, Janus adaptive Luna workers, Mercury Luna Medium only, or Jupiter Luna High only. For orchestration the controlling workflow requires one permission-auto-accepted non-Goal Atlas Sol Medium session, with native `returnResult: true` deliveries; no polling, custom wait scripts or automatic Goal mode.
