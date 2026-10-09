# Shared component ownership

`packages/components` owns reusable presentation primitives installed from
[Vandor UI](https://vandor-ui.vercel.app/llms-full.txt). `apps/storybook` owns the
preview host, not component source. `apps/web` owns route adapters and feature/page
compositions. Colocate route-specific presentation and stories under `-components`;
promote feature compositions only when genuinely reusable. Small UI primitives
(buttons, inputs, selects, badges, and similar controls) belong in
`packages/components`, not application-local copies.

## Installation and imports

- All new primitive UI uses explicit `@repo/components/<name>` entrypoints. Check the
  installed exports first; the catalog contains Button and Loading, plus internal
  loading visuals, not all Vandor components.
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
- The web-local Button and its stories have been removed; all Button usage imports
  `@repo/components/button`. Other existing local presentation components are
  retained until a scoped migration. Do not recreate a local Button, install new
  primitives in `apps/web`, or mass-migrate unrelated existing components.

## Styling and composition

- Import `@repo/components/styles.css` after Tailwind in the consumer stylesheet.
  It registers shared source and extra semantic utilities; consumers own theme
  values. Storybook imports web's stylesheet so both use the same tokens.
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

Follow [verification.md](verification.md): typecheck the owner and consumers, use
builds for module/CSS integration, and verify affected stories in the existing
permission-managed Storybook. Record local source adaptations and blocked checks
in the package README. Do not claim browser acceptance from typecheck/build alone.
