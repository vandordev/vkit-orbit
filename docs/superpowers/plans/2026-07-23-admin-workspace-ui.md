# Optional Admin Workspace UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the proven operations-dashboard experience as a neutral template with no baseline UI cost.

**Architecture:** The template owns reusable components and descriptors only. A consuming project supplies routes, icons, current-user loading, logout action, and optional authorization predicate; baseline `apps/web` remains unchanged until installation.

**Tech Stack:** React, TanStack Router/Query, Tailwind CSS, shadcn/ui.

---

## File structure

- Create: `recipes/admin-workspace-ui/README.md` — install/uninstall and dependency tiers.
- Create: `recipes/admin-workspace-ui/files/apps/web/src/components/{admin-shell.tsx,command-menu.tsx,user-menu.tsx}` — neutral template components.
- Create: `recipes/admin-workspace-ui/files/apps/web/src/lib/{get-strict-context.tsx,admin-navigation.ts}` — context utility and descriptors.
- Create: `recipes/admin-workspace-ui/tests/admin-shell.test.tsx` — portable behavioral tests.

### Task 1: Define neutral installation surface

- [ ] Add recipe tests requiring `AdminNavigationItem { label, to, icon?, visible? }` and `AdminShellProps { navigation, currentUser, onLogout, children }` without product labels or API clients.
- [ ] Run recipe tests; expect failure before template files exist.
- [ ] Write README copy instructions, Tailwind/shadcn prerequisites, and a dependency table separating core shell from Animate UI and advanced table options.
- [ ] Create descriptor and strict-context utility; its hook throws a named error outside a provider. Commit `docs(recipe): define admin workspace contract`.

### Task 2: Build accessible shell behaviors

- [ ] Add React tests for current-user loading, collapsed navigation accessible labels/tooltips, authorization-filtered items, `Meta/Ctrl+K` command opening, and logout callback.
- [ ] Implement a responsive shell using neutral labels, `aria-label` values, keyboard event cleanup, and consumer-provided route links/callbacks.
- [ ] Run `rtk bun test ./recipes/admin-workspace-ui/tests`; expect PASS. Commit `feat(recipe): add neutral admin shell`.

### Task 3: Add optional UI tiers without baseline leakage

- [ ] Add tests/docs assertions that root `apps/web/package.json` is unchanged and no baseline route imports recipe files.
- [ ] Document Animate UI as an optional sidebar enhancement and Niko Table as a separately installed advanced-data-grid option, including its large maintenance cost.
- [ ] Add a static example page only under the recipe, never baseline routes. Run recipe tests plus `rtk bun test apps/web`; expect PASS. Commit `docs(recipe): document optional dashboard extensions`.

