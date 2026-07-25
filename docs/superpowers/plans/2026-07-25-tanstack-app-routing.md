# TanStack App Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move web routes to a documented `src/app` directory, preserve the embedded Elysia transport boundary, and ship the Vkit Orbit default landing experience with consistent metadata, loading, and error UI.

**Architecture:** TanStack's file-route plugin reads `apps/web/src/app`; its generated tree remains `src/routeTree.gen.ts`. UI routes use native TanStack tokens, typed Eden data access, and route-level boundaries. The `/api/*` and `/health` files remain server-only Elysia adapters that forward the original request and response unchanged.

**Tech Stack:** Bun 1.3.14, TypeScript 5.9, React 19, TanStack Start/Router, Elysia/Eden, Zod, Tailwind CSS 4, shadcn/ui, `@loading-ui/symmetric-wave`, Framer Motion, Bun test.

## Global Constraints

- TanStack Start is the only public HTTP server; Elysia owns business endpoints under `/api/*` and `/health`.
- The adapters call `app.fetch(request)` directly; they do not proxy, transform response bodies/statuses, or render TanStack UI boundaries.
- Use `src/app`, `__root.tsx`, `index.tsx`, `route.tsx`, `$name`, `$`, `_name`, `(name)`, and `-name` only with their native TanStack meanings.
- `routeTree.gen.ts` is generated and must not be hand-edited.
- Non-route code in `src/app` begins with `-`; `_` is reserved for pathless layouts.
- UI route code uses Eden clients only; it must not import Prisma, database config, or application usecases.
- Use `validateSearch` with Zod for every UI search parameter and typed `<Link>`/`navigate` for internal navigation.
- The default pending UI is the shadcn-installed Symmetric Wave component; the global error UI must use `reset()` and never expose raw production error details.
- All motion honors `prefers-reduced-motion`; the landing remains understandable and operable without motion.
- Preserve unrelated working-tree changes. Prefix every shell command with `rtk`; prefer Taskfile verification commands.

---

## Locked File Structure

```text
apps/web/src/
├── app/
│   ├── __root.tsx
│   ├── __root.test.tsx
│   ├── _public/
│   │   ├── route.tsx
│   │   ├── index.tsx
│   │   ├── index.test.tsx
│   │   └── -components/
│   │       ├── architecture-map.tsx
│   │       ├── orbit-hero.tsx
│   │       └── public-header.tsx
│   ├── -components/
│   │   ├── global-error.tsx
│   │   ├── global-not-found.tsx
│   │   └── global-pending.tsx
│   ├── api/
│   │   ├── $.ts
│   │   └── $.test.ts
│   └── health/
│       ├── index.ts
│       └── index.test.ts
├── components/ui/symmetric-wave.tsx
├── lib/metadata.ts
├── lib/metadata.test.ts
├── routeTree.gen.ts
└── router.tsx
```

`.agent/` becomes `architecture.md`, `config.md`, `database.md`, plus
`web/README.md`, `web/routing.md`, `api/README.md`, `worker/README.md`,
`scheduler/README.md`, and `realtime/README.md`.

### Task 1: Restructure agent guidance and update discovery rules

**Files:**
- Modify: `AGENTS.md`
- Move: `.agent/api.md` → `.agent/api/README.md`
- Move: `.agent/worker.md` → `.agent/worker/README.md`
- Move: `.agent/scheduler.md` → `.agent/scheduler/README.md`
- Move: `.agent/realtime.md` → `.agent/realtime/README.md`
- Move: `.agent/web.md` → `.agent/web/README.md`
- Move: `.agent/ui.md` → `.agent/web/README.md` (merge its shadcn/TanStack baseline)
- Create: `.agent/web/routing.md`
- Keep: `.agent/architecture.md`, `.agent/config.md`, `.agent/database.md`

**Interfaces:**
- Consumes: the existing short runtime instructions and approved routing spec.
- Produces: runtime-local rules discoverable by `AGENTS.md`, with `web/routing.md` as the detailed web source of truth.

- [ ] **Step 1: Write the failing documentation-discovery check**

Add a temporary assertion block to the planning scratchpad or run these checks before moving files:

```bash
rtk test -f .agent/web/routing.md
rtk rg -n "\.agent/\*\.md" AGENTS.md
```

Expected: the first command fails because `routing.md` does not exist; the second command shows the non-recursive instruction.

- [ ] **Step 2: Move and merge the runtime documents**

Use `git mv` for every one-to-one move. Create `.agent/web/README.md` by merging the current web ownership guidance with the current UI baseline: TanStack Start, Tailwind, shadcn/ui, accessibility, typed Eden, and a link to `routing.md`. Do not duplicate routing detail in the README.

- [ ] **Step 3: Author `.agent/web/routing.md`**

Document the approved conventions with these sections: route tree, token table, pathless layouts, ignored colocation, Elysia adapter isolation, Eden/loader/Query boundary, Zod search validation, typed navigation, future `_authenticated` guard, metadata helper, pending/error/not-found behavior, reduced-motion policy, generated tree ownership, and focused test commands. Include concrete `api/$.ts`, `health/index.ts`, `_public/index.tsx`, and `$userId/index.tsx` examples.

- [ ] **Step 4: Update `AGENTS.md`**

Replace the start-here instruction with an explicit requirement to read `README.md`, the relevant `.agent/**/*.md` files for the runtime being changed, and the current plan/spec before changing code. Preserve all existing architecture and workflow rules.

- [ ] **Step 5: Verify documentation discovery**

Run:

```bash
rtk test -f .agent/web/routing.md
rtk rg -n "\.agent/\*\*/\*\.md" AGENTS.md
rtk rg -n "Elysia|validateSearch|Symmetric Wave|routeTree.gen" .agent/web
```

Expected: all commands succeed and the routing guide contains the mandatory rules.

- [ ] **Step 6: Commit**

```bash
rtk git add AGENTS.md .agent
rtk git commit -m "docs: organize runtime agent guidance"
```

### Task 2: Move the route source and preserve Elysia adapters

**Files:**
- Modify: `apps/web/vite.config.ts`
- Move: `apps/web/src/routes/__root.tsx` → `apps/web/src/app/__root.tsx`
- Move: `apps/web/src/routes/__root.test.tsx` → `apps/web/src/app/__root.test.tsx`
- Move: `apps/web/src/routes/api.$.ts` → `apps/web/src/app/api/$.ts`
- Move: `apps/web/src/routes/api.$.test.ts` → `apps/web/src/app/api/$.test.ts`
- Move: `apps/web/src/routes/health.ts` → `apps/web/src/app/health/index.ts`
- Move: `apps/web/src/routes/health.test.ts` → `apps/web/src/app/health/index.test.ts`
- Delete: `apps/web/src/routes/index.tsx`
- Regenerate: `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Consumes: `@repo/api`'s `app` and `App`, and the route-plugin configuration.
- Produces: `Route` exports at `/api/$` and `/health` whose `server.handlers` preserve all current behavior.

- [ ] **Step 1: Strengthen the adapter tests before moving files**

In the current adapter tests, assert the exact handler keys and the Elysia response:

```ts
expect(Object.keys((route.Route as any).options.server.handlers).sort())
  .toEqual(["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]);
expect((route.Route as any).options.component).toBeUndefined();
expect((route.Route as any).options.errorComponent).toBeUndefined();
expect(response.status).toBe(200);
expect(await response.json()).toEqual({ success: true, data: { status: "ok" } });
```

Run:

```bash
rtk bun test apps/web/src/routes/api.$.test.ts apps/web/src/routes/health.test.ts
```

Expected: PASS before the move; these assertions define the non-regression contract.

- [ ] **Step 2: Move route files with `git mv` and configure `src/app`**

Set `tanstackStart({ router: { routesDirectory: "./src/app", routeFileIgnorePattern: "\\.test\\." } })`. Preserve `routeTree.gen.ts` location. Keep `api/$.ts` as a server-only route with the seven current methods and `getTreaty`; keep `health/index.ts` as server-only GET delegation. Do not add a component or any UI route option to either adapter.

- [ ] **Step 3: Regenerate the route tree and fix generated route paths**

Run:

```bash
rtk bun --cwd apps/web run dev
```

Stop the process after the router plugin writes `src/routeTree.gen.ts`. Confirm its imports resolve from `./app/`; do not edit the generated file directly.

- [ ] **Step 4: Run moved focused tests**

Run:

```bash
rtk bun test apps/web/src/app/api/$.test.ts apps/web/src/app/health/index.test.ts
rtk bun --cwd apps/web run check-types
```

Expected: adapter tests pass with unchanged response status/body and web typecheck passes.

- [ ] **Step 5: Commit**

```bash
rtk git add apps/web/vite.config.ts apps/web/src/app apps/web/src/routeTree.gen.ts
rtk git commit -m "refactor(web): move TanStack routes into app"
```

### Task 3: Install the Symmetric Wave loading primitive

**Files:**
- Create: `apps/web/src/components/ui/symmetric-wave.tsx` (generated by shadcn)
- Modify: `apps/web/package.json`
- Modify: `bun.lock`

**Interfaces:**
- Consumes: the exact `@loading-ui/symmetric-wave` registry item.
- Produces: the generated `SymmetricWave` UI component imported by `GlobalPending` in Task 4.

- [ ] **Step 1: Verify the component is absent**

Run:

```bash
rtk test -f apps/web/src/components/ui/symmetric-wave.tsx
```

Expected: FAIL because the registry component is absent.

- [ ] **Step 2: Inspect the exact registry item before installation**

Run from `apps/web`:

```bash
rtk bunx --bun shadcn@latest view @loading-ui/symmetric-wave
```

Expected: the registry details identify the Symmetric Wave source and every file/dependency the add command will apply. Confirm the component destination is `src/components/ui/symmetric-wave.tsx` and that its imports are compatible with the existing `@/` aliases.

- [ ] **Step 3: Add the exact registry component**

Run from `apps/web`:

```bash
rtk bunx --bun shadcn@latest add @loading-ui/symmetric-wave
```

Read the generated file, confirm it imports with the existing `@/` alias and has no incompatible hard-coded alias.

- [ ] **Step 4: Verify and commit**

Run:

```bash
rtk test -f apps/web/src/components/ui/symmetric-wave.tsx
rtk bun --cwd apps/web run check-types
```

Expected: PASS.

```bash
rtk git add apps/web/package.json bun.lock apps/web/src/components/ui/symmetric-wave.tsx
rtk git commit -m "feat(web): add symmetric wave loading primitive"
```

### Task 4: Add typed metadata and root UI boundaries

**Files:**
- Create: `apps/web/src/lib/metadata.ts`
- Create: `apps/web/src/lib/metadata.test.ts`
- Create: `apps/web/src/app/-components/global-error.tsx`
- Create: `apps/web/src/app/-components/global-not-found.tsx`
- Create: `apps/web/src/app/-components/global-pending.tsx`
- Modify: `apps/web/src/app/__root.tsx`
- Modify: `apps/web/src/app/__root.test.tsx`

**Interfaces:**
- Produces: `createMetadata(input: MetadataInput)` with `title`, `description`, optional `pathname`, and optional `image` input.
- Produces: `GlobalError({ error, reset })`, `GlobalNotFound()`, and `GlobalPending()` route-boundary components.
- Consumes: shadcn `Button`, typed TanStack `Link`, and the Symmetric Wave component introduced in Task 3.

- [ ] **Step 1: Write failing metadata and boundary-contract tests**

Create `metadata.test.ts` with the exact expected output shape:

```ts
expect(createMetadata({ title: "Pricing", description: "Plans", pathname: "/pricing" }))
  .toMatchObject({
    meta: [
      { title: "Pricing | Vkit Orbit" },
      { name: "description", content: "Plans" },
      { property: "og:title", content: "Pricing | Vkit Orbit" },
    ],
    links: [{ rel: "canonical", href: "/pricing" }],
  });
expect(createMetadata({ title: "Vkit Orbit", description: "Home", image: "/orbit.png" }))
  .toMatchObject({ meta: [{ title: "Vkit Orbit" }, { property: "og:image", content: "/orbit.png" }], links: [] });
```

Extend `__root.test.tsx` to require `errorComponent`, `notFoundComponent`, `pendingComponent`, `GlobalError`, `GlobalNotFound`, and `GlobalPending` in the root source. Add a source-level error test requiring `reset()` and `<Link to="/">` in `global-error.tsx`.

Run:

```bash
rtk bun test apps/web/src/lib/metadata.test.ts apps/web/src/app/__root.test.tsx
```

Expected: FAIL because helper and boundary files do not exist.

- [ ] **Step 2: Implement `createMetadata`**

Define and export:

```ts
export type MetadataInput = {
  title: string;
  description: string;
  pathname?: string;
  image?: string;
};

export function createMetadata({ title, description, pathname, image }: MetadataInput) {
  const fullTitle = title === "Vkit Orbit" ? title : `${title} | Vkit Orbit`;
  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      ...(image ? [{ property: "og:image", content: image }] : []),
    ],
    links: pathname ? [{ rel: "canonical", href: pathname }] : [],
  };
}
```

Append ` | Vkit Orbit` unless the given title is exactly `Vkit Orbit`; add description and Open Graph title/description, add `og:image` only when `image` exists, and add canonical only when `pathname` exists.

- [ ] **Step 3: Implement accessible global boundary components**

`GlobalError` renders an `AlertTriangle` status icon, an `h1` with "Something went off course", safe recovery copy, a primary Button that calls `reset`, and a secondary `Button asChild` containing `<Link to="/">Back to home</Link>`. Use semantic Tailwind tokens, keyboard-visible focus, and no raw `error.message`.

`GlobalNotFound` renders a `h1` with "Page not found" and the same typed home action. `GlobalPending` wraps `SymmetricWave` with an `aria-live="polite"` status and "Loading" text.

- [ ] **Step 4: Wire root route options**

Keep the current document shell and QueryProvider in `__root.tsx`; import the three components and assign:

```ts
errorComponent: GlobalError,
notFoundComponent: GlobalNotFound,
pendingComponent: GlobalPending,
```

Retain charset, viewport, stylesheet, `<HeadContent />`, and `<Scripts />`; replace the hard-coded title with `createMetadata({ title: "Vkit Orbit", description: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers." })`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
rtk bun test apps/web/src/lib/metadata.test.ts apps/web/src/app/__root.test.tsx
rtk bun --cwd apps/web run check-types
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
rtk git add apps/web/src/lib/metadata.ts apps/web/src/lib/metadata.test.ts apps/web/src/app
rtk git commit -m "feat(web): add route metadata and global boundaries"
```

### Task 5: Build the pathless public shell and Vkit Orbit landing page

**Files:**
- Create: `apps/web/src/app/_public/route.tsx`
- Create: `apps/web/src/app/_public/index.tsx`
- Create: `apps/web/src/app/_public/index.test.tsx`
- Create: `apps/web/src/app/_public/-components/public-header.tsx`
- Create: `apps/web/src/app/_public/-components/orbit-hero.tsx`
- Create: `apps/web/src/app/_public/-components/architecture-map.tsx`
- Modify: `apps/web/package.json`
- Modify: `bun.lock`
- Regenerate: `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Consumes: `createMetadata`, shadcn `Button`, `lucide-react`, and Framer Motion.
- Produces: the `/` route through `_public/index.tsx`, with static orbital content and progressively enhanced motion.

- [ ] **Step 1: Write failing route and content tests**

Create `index.test.tsx` that reads `index.tsx` and asserts:

```ts
expect(source).toContain('createFileRoute("/_public/")');
expect(source).toContain("createMetadata");
expect(source).toContain("Vkit Orbit");
expect(source).toContain("OrbitHero");
expect(source).toContain("ArchitectureMap");
```

Add assertions that `orbit-hero.tsx` contains `useReducedMotion` and `architecture-map.tsx` contains the labels `TanStack Start`, `Embedded Elysia`, `Prisma`, `River`, `Go worker`, and `Realtime (optional)`.

Run:

```bash
rtk bun test apps/web/src/app/_public/index.test.tsx
```

Expected: FAIL because the pathless public route does not exist.

- [ ] **Step 2: Add Framer Motion**

Run:

```bash
rtk bun --cwd apps/web add framer-motion
```

Use it only in the public visual components. CSS/SVG must render the central mark, rings, and runtime nodes without JavaScript; Framer Motion may animate opacity, transform, and hover only when `useReducedMotion()` is false.

- [ ] **Step 3: Implement the public route files**

`_public/route.tsx` renders `<Outlet />` and can own public-shell metadata defaults. `_public/index.tsx` calls `createMetadata({ title: "Vkit Orbit", description: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers.", pathname: "/" })` and composes `PublicHeader`, `OrbitHero`, and `ArchitectureMap`.

Use the existing shadcn `Button` for calls to action. Keep the copy explicitly boilerplate-oriented and do not invent a product workflow, auth flow, or API proxy. The architecture map must show Browser → TanStack Start + embedded Elysia → Prisma/PostgreSQL, plus scheduler/worker/realtime as optional supporting runtimes.

- [ ] **Step 4: Regenerate and verify the public route**

Run the Vite dev command once to update `routeTree.gen.ts`, then run:

```bash
rtk bun test apps/web/src/app/_public/index.test.tsx
rtk bun --cwd apps/web run check-types
rtk bun --cwd apps/web run build
```

Expected: route test, typecheck, and production web build pass.

- [ ] **Step 5: Commit**

```bash
rtk git add apps/web/package.json bun.lock apps/web/src/app/_public apps/web/src/routeTree.gen.ts
rtk git commit -m "feat(web): add Vkit Orbit boilerplate landing"
```

### Task 6: Finish the complete web routing documentation

**Files:**
- Modify: `.agent/web/README.md`
- Modify: `.agent/web/routing.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: implemented route tree, metadata helper, boundaries, and adapter tests.
- Produces: documentation whose paths, commands, and code snippets all match the implementation.

- [ ] **Step 1: Write a failing documentation-path check**

Run:

```bash
rtk rg -n "src/routes|api\.\$\.ts|routes/health\.ts" .agent/web README.md
```

Expected: FAIL while stale route paths are still documented or no relevant routing reference exists in the README.

- [ ] **Step 2: Update documentation against the implemented files**

In `.agent/web/routing.md`, replace all legacy paths with `src/app`. Include an exact tree, token table, ignored `-` example, `_public` pathless layout, `api/$.ts`, `health/index.ts`, `createMetadata`, the Symmetric Wave pending wrapper, `GlobalError`, Elysia response isolation, Eden loader/browser behavior, Zod validation, typed navigation, future auth placement, and focused test commands.

In `.agent/web/README.md`, retain concise hard rules and link to `routing.md`. In the root README, replace the old route adapter paths with `src/app/api/$.ts` and `src/app/health/index.ts`, and link to `.agent/web/routing.md` for the convention.

- [ ] **Step 3: Verify documentation matches source**

Run:

```bash
rtk rg -n "src/app/api/\$\.ts|src/app/health/index\.ts|routeTree\.gen\.ts|Symmetric Wave|GlobalError" .agent/web README.md
rtk rg -n "src/routes|api\.\$\.ts|routes/health\.ts" .agent/web README.md
```

Expected: the first command finds every current convention; the second returns no stale routing paths.

- [ ] **Step 4: Commit**

```bash
rtk git add .agent README.md
rtk git commit -m "docs(web): document TanStack app routing"
```

### Task 7: Run repository verification and Compose smoke checks

**Files:**
- Verify only: modified web routes, agent docs, `apps/web/package.json`, `bun.lock`, and generated tree.

**Interfaces:**
- Consumes: every preceding task's route, documentation, dependency, and test contract.
- Produces: evidence that web builds and the default Compose service exposes both Elysia endpoints.

- [ ] **Step 1: Run focused tests**

Run:

```bash
rtk bun test apps/web/src/app apps/web/src/lib
```

Expected: all moved adapter, root-boundary, metadata, and public-route tests pass.

- [ ] **Step 2: Run mandated quality and build commands**

Run:

```bash
rtk task quality
rtk task build
```

Expected: zero test, lint, typecheck, vet, or build failures.

- [ ] **Step 3: Run the default Compose smoke check**

Run:

```bash
rtk task compose:up:detached
rtk task web:health
rtk task api:status
rtk task compose:down
```

Expected: `/health` returns success through embedded Elysia; `/api/status` returns the Elysia status envelope; Compose stops cleanly.

- [ ] **Step 4: Inspect final change set and commit verification-only fixes if needed**

Run:

```bash
rtk git status --short
rtk git diff --check
```

Expected: no unexpected files and no whitespace errors. If verification exposes a scoped issue, add a focused failing test, apply the smallest correction, rerun the relevant command, and commit with `fix(web): <specific behavior>`.
