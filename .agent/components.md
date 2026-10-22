# Shared component ownership

`packages/components` owns reusable presentation primitives installed from
[Vandor UI](https://vandor-ui.vercel.app/llms-full.txt). `apps/storybook` owns the
preview host, not component source. `apps/web` owns route adapters and feature/page
compositions. Colocate route-specific presentation and stories under `-components`;
promote feature compositions only when genuinely reusable. Small UI primitives
(buttons, inputs, selects, badges, and similar controls) belong in
`packages/components`, not application-local copies.

## Installation and imports

- All application primitive UI, including existing controls and stories, uses direct
  `@repo/components/<name>` entrypoints. Check installed exports first: Button,
  Input, Table, Loading, AppShell, Drawer and Tooltip are available, not the entire
  Vandor catalog. Input/Table have deliberately scoped APIs documented in the README.
- Run registry commands inside `packages/components`, using its `components.json`.
  Install only needed components and dependencies. Consult Vandor documentation
  for the actual API; generic shadcn guidance does not override registry contracts.
- Preview installs/updates with `--dry-run` and `--diff`. Read generated files,
  check dependency closure and imports, then preserve local adaptations. Never
  blindly overwrite customized source or disable TypeScript strictness.
- Add explicit package exports for new public components. Keep helpers internal;
  no root barrel importing the entire catalog. Internal imports must resolve in
  both web and Storybook without relying on web's `@` alias. Prefer relative
  imports inside this package.
- If a needed primitive is not installed, install it into `packages/components`
  and expose its public entrypoint before use; do not create a web-local fallback
  or assume the full catalog is available.
- Do not render native controls in applications, including legacy UI and stories:
  buttons, inputs, selects/options/groups, textareas, labels, dialogs,
  details/summary, table elements/captions, and progress/meter. Native implementations
  belong only in `packages/components`. Intrinsic aliases, motion wrappers, JSX
  factories, local copies/re-exports, and direct Base UI/Radix imports are not escapes.
  Structural HTML, forms, headings, lists, links, and SVG remain allowed; feature
  compositions and unrelated visual presentation remain application-owned.
- Run `task check:ui-primitives`; root/web typechecks include this static source
  policy check. It scans `apps` including stories, excluding test/spec files and
  generated/dependency directories. It catches common static bypasses, not arbitrary
  runtime indirection; source review must still uphold the policy.

## Styling and composition

- Import `@repo/components/styles.css` after Tailwind in the consumer stylesheet.
  It registers shared source and extra semantic utilities. Brand color values come
  from `@repo/brand/tokens.css`; consumers own utility mappings, not duplicate
  palettes. Storybook imports web's stylesheet so both use the same tokens.
- Use component variants/sizes and semantic colors first. Prefer `className` for
  layout. Change shared visual defaults in the component/token owner instead of
  repeating per-page color overrides.
- Keep components prop-driven, browser-safe, and independent of auth, routes,
  Prisma, real API clients, credentials, and product data fetching.
- Check composition per component. Vandor Button supports `asChild`, `render`,
  `nativeButton`, `isLoading`, and `whileTap`; other Base UI components may not
  match local Radix APIs. For navigation, prefer Button `asChild` with a real link
  so native link semantics remain intact. `variant="link"` alone is still a button.
- Use `isLoading` for pending Button actions, `disabled` for unavailable actions,
  explicit `type="submit"` in forms, and `aria-label` on icon-only buttons.
  Native `disabled` does not disable an `asChild` link. Preserve reduced-motion,
  visible keyboard focus, labels, and safe accessible feedback.
- Providers are consumer-owned; installing a component never implies its required
  providers or backend features are available.

## Stories and verification

Keep `*.stories.tsx` beside the actual shared component. Install upstream portable
stories when available, then add relevant consumer cases rather than duplicating
the component implementation. Stories import relatively or through public package
exports, use deterministic local state, and never call production APIs.

Follow [verification.md](verification.md): typecheck the owner and consumers and
verify affected stories in the existing permission-managed Storybook. No automatic
lint/build or system verification gates. Record local source adaptations and blocked checks
in the package README. Do not claim browser acceptance from typecheck/build alone.
