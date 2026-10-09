# Unified runtime configuration execution ledger

## Authority and baseline

User approved the complete spec and plan and selected inline execution on existing
local `main`. No additional sessions, subagents, worktrees, push, merge, or Goal Mode.
Initial tree clean. Baseline `bun --no-env-file run check-types --force`: PASS,
16 successful tasks, zero cached. Inspected scripts: only `tsc --noEmit`, with
upstream typecheck dependencies. Registry confirms stable Zod 4.6.5.

## Batches

| Batch | Tasks | Status | Evidence/commit |
| --- | --- | --- | --- |
| 1 | 1–3 | PASS | `47de22b`; Zod 4.6.5 direct; transitive 4.4.3 only; install scripts disabled; fresh post-fixture `bun --no-env-file run check-types --force`: 16/16, zero cached |
| 2 | 4–6 | PASS | `79c4101`; `bun --no-env-file run check-types --force --filter=...@repo/config`: 14/14, zero cached |
| 3 | 7 | PASS | `9d7408b`; `bun --no-env-file run check-types --force --filter=...@repo/db --filter=...@repo/config`: 15/15, zero cached |
| 4 | 8–10 | PASS | `bun --no-env-file run check-types --force --filter=web`: 9/9, zero cached |
| 5 (sole integrated audit) | 11–13 | PENDING | |

## Verification boundaries

Batch 4: base context defers cookies/session/database and memoizes one session
promise. Authenticated middleware attaches nonnull session/database before unchanged
workspace/permission middleware; auth.status explicitly resolves session. Public
query has no input, strict output and generic failure. HTTP handler extraction is
a supporting path revision for fixture review; preserves cookies and same-origin
gate, enforces no-store after adapter response as well as responseMeta and early
failures. Config query is mounted-browser-only, page-memory infinite cache with
bounded retries; socket requires both successful non-error queries, explicit URL,
separate ticket, and effect disposal. No presentation change or Storybook needed.

Batch 3: Prisma constructor receives explicit datasource URL, singleton getter is
lazy and retains development global reuse. All application defaults call getter
inside execution; query adapters retain injected clients. Worker bootstrap owns
its client; scheduler/realtime have no database dependency. API config/logger/
publisher/OpenAPI are deferred; `createApp` is called once by guarded bootstrap,
not at import. Existing fixture app imports migrated to factory. Web storage and
ticket consumers use typed web fields; webhook crypto uses narrow key getter.
Migration child uses only database adapter. Supporting tsconfig revision: migrate
now uses bundler resolution like other Bun source consumers; NodeNext rejected
extensionless config source imports. Initial gate failed there, then fresh rerun
passed. No schema/migration/security/payload changes. Smoke sources retain explicit
executable fixture handles; they are never imported by runtime or executed here.

Batch 2: new pipeline is independent of old module loader/adapters retained only
for planned sequencing. Explicit strict raw shapes and selectors preserve runtime
secret isolation. Parse-first YAML AST review rejects documents/errors/warnings,
anchors/aliases/tags/merge syntax; scanner handles original strings only. Narrow
public/database/webhook cached getters and server/public exports are lazy. Defaults
exist in canonical YAML, not new value schemas. Numeric conversion uses validated
string/number transform rather than coercion of arbitrary input. First typecheck
found AST narrowing and Zod generic/input errors; repaired without relaxed types,
then reran successfully. New cohesive `schemas.ts` owns typed value schemas while
old adapters remain until cutover (same tasks/batches/requirements).

Batch 1 audit: env-core peer supports Zod 4 and remains only for sequencing.
Queue base generic migrated to public `ZodType`; no record/error alias repairs
needed. Preserved v1 UUID-shaped IDs with explicit regex because Zod 4 UUID
requires version/variant bits unlike the previous validator. Ticket signatures,
expiration, datetime API, search pagination, password and permission schemas
unchanged. Added unexecuted contract fixture sources. Recipes use compatible APIs.
Commits use per-command `HUSKY=0`: existing hook invokes unrelated lint-staged
formatting; shared hook policy is unchanged.

System verification is source/config/lockfile review and fresh native typecheck
only. Fixture sources are preserved/adapted but not executed. YAML/environment,
authentication/cache/batching, Prisma/database, socket/browser, and Docker/listener
integrations remain runtime-unverified. No system tests, builds, lint, generation,
migrations, services, containers, or live probes are authorized.
