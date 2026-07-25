# Web Brand Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize web application branding and default metadata in `apps/web/src/lib/config.ts` and document the convention.

**Architecture:** A server-safe, static `appConfig` object is the single source of truth for the application name, default title, default description, favicon path, and repository URL. Metadata, the root document, and the public landing components consume this object; no environment variables or shared UI primitive changes are introduced.

**Tech Stack:** TypeScript, TanStack Start, TanStack Router, Bun test, Markdown.

## Global Constraints

- Keep `apps/web` as the only public server and preserve embedded Elysia adapter boundaries.
- Do not read credentials or `process.env` from the web feature config.
- Keep `apps/web/src/routeTree.gen.ts` generated and never edit it manually.
- Preserve `components/ui/button.tsx`; brand styling/config belongs at call sites or route files.
- Use `apply_patch` for text edits.

---

### Task 1: Add the typed web brand config

**Files:**
- Create: `apps/web/src/lib/config.ts`
- Create: `apps/web/src/lib/config.test.ts`

**Interfaces:**
- Produces `appConfig` with `appName`, `defaultTitle`, `defaultDescription`, `favicon`, and `repositoryUrl` string fields.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";

import { appConfig } from "./config";

describe("web app config", () => {
  test("exposes the default brand configuration", () => {
    expect(appConfig).toEqual({
      appName: "Vkit Orbit",
      defaultTitle: "Vkit Orbit",
      defaultDescription: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers.",
      favicon: "/favicon.ico",
      repositoryUrl: "https://github.com/vandordev/vx",
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run `bun test ./apps/web/src/lib/config.test.ts` from the repository root. It must fail because `./config` does not exist.

- [ ] **Step 3: Implement the minimal config**

```ts
export const appConfig = {
  appName: "Vkit Orbit",
  defaultTitle: "Vkit Orbit",
  defaultDescription: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers.",
  favicon: "/favicon.ico",
  repositoryUrl: "https://github.com/vandordev/vx",
} as const;
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run `bun test ./apps/web/src/lib/config.test.ts`; expect one passing test.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/config.ts apps/web/src/lib/config.test.ts
git commit -m "feat(web): add centralized app config"
```

### Task 2: Replace hard-coded web brand values

**Files:**
- Modify: `apps/web/src/lib/metadata.ts`
- Modify: `apps/web/src/lib/metadata.test.ts`
- Modify: `apps/web/src/app/__root.tsx`
- Modify: `apps/web/src/app/__root.test.tsx`
- Modify: `apps/web/src/app/_public/index.tsx`
- Modify: `apps/web/src/app/_public/index.test.tsx`
- Modify: `apps/web/src/app/_public/-components/public-header.tsx`

**Interfaces:**
- `createMetadata` uses `appConfig.appName` as the brand suffix and accepts the existing route-specific metadata input.
- Root metadata uses `appConfig.defaultTitle`, `appConfig.defaultDescription`, and `appConfig.favicon`.
- Landing copy and repository CTA use `appConfig.appName`, `appConfig.defaultDescription`, and `appConfig.repositoryUrl`.

- [ ] **Step 1: Add failing source-contract assertions**

Extend the existing tests to require `appConfig` imports/usages in metadata, root, landing, and header sources, and require metadata branding to follow `appConfig.appName`.

- [ ] **Step 2: Run focused tests and verify RED**

Run `bun test ./apps/web/src/lib/metadata.test.ts ./apps/web/src/app/__root.test.tsx ./apps/web/src/app/_public/index.test.tsx`; expect failures because current files still hard-code brand values.

- [ ] **Step 3: Implement the smallest replacements**

Import `appConfig` in each consumer. Replace the hard-coded title, description, favicon, repository URL, and visible app-name strings with config fields. In `metadata.ts`, use `appConfig.appName` instead of the literal `Vkit Orbit` when composing a suffixed title.

- [ ] **Step 4: Run focused tests and web typecheck**

Run `bun test ./apps/web/src/lib/metadata.test.ts ./apps/web/src/app/__root.test.tsx ./apps/web/src/app/_public/index.test.tsx` and `bun run check-types` from `apps/web`; expect all to pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib apps/web/src/app
git commit -m "refactor(web): consume centralized app config"
```

### Task 3: Document web configuration ownership

**Files:**
- Modify: `.agent/web/README.md`
- Modify: `.agent/web/routing.md`
- Modify: `README.md`

- [ ] **Step 1: Add the configuration convention**

Document `apps/web/src/lib/config.ts` as the single source of truth for static web brand/default metadata, list its fields, state that route metadata may override descriptions/title per page, and state that credentials/environment values remain in the YAML runtime configuration system.

- [ ] **Step 2: Verify documentation**

Run `rg -n "lib/config\.ts|appConfig|defaultDescription|repositoryUrl|environment" .agent/web README.md` and `git diff --check`.

- [ ] **Step 3: Commit**

```bash
git add .agent/web README.md
git commit -m "docs(web): document centralized app config"
```

### Task 4: Run final verification

- [ ] **Step 1: Run focused web tests**

Run `bun test apps/web/src/app apps/web/src/lib`.

- [ ] **Step 2: Run repository quality and build checks**

Run `task quality` and `task build`.

- [ ] **Step 3: Inspect the final change set**

Run `git status --short` and `git diff --check`; expect a clean working tree and no whitespace errors.
