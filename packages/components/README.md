# Shared components

`@repo/components` owns editable React presentation source installed from
[Vandor UI](https://vandor-ui.vercel.app/llms-full.txt). The initial example is
Button, installed through the shadcn CLI together with its internal licensed
`loading-arc.tsx` dependency and optional portable stories. No other Vandor
components, providers, or application routes are installed by this example.

## Usage

Declare `"@repo/components": "*"` in the consuming workspace. Use explicit
entrypoints; no root barrel is exposed:

```tsx
import { Button } from "@repo/components/button";

export function SaveAction({ pending, onSave }: { pending: boolean; onSave: () => void }) {
	return (
		<Button isLoading={pending} onClick={onSave}>
			Save changes
		</Button>
	);
}
```

React 19/React DOM 19 are peer dependencies. TypeScript source is consumed directly
by Vite. Shared source never imports web routes, API clients, or server modules.

```css
@import "tailwindcss";
@import "@repo/components/styles.css";
```

The stylesheet registers the package source with Tailwind 4 and exposes secondary,
accent, destructive, and input utilities. The consumer supplies the standard
background/foreground, primary, secondary, accent, muted, destructive, border,
input, ring, and radius tokens. Web retains its current light palette and supplies
the missing roles; Storybook loads the same web stylesheet. No theme switch or
new dark palette is installed.

## Button contract

See [the upstream reference](https://vandor-ui.vercel.app/docs/components/button).
Variants: default, secondary, outline, ghost, destructive, link. Sizes: xs, sm,
default, lg, icon-xs, icon-sm, icon, icon-lg. `isLoading` shows the internal Arc,
disables native actions, blocks link clicks, and sets `aria-busy`; icon-only sizes
retain their `aria-label`. `whileTap={false}` disables press scaling; reduced-motion
preferences also suppress scaling and spinner animation.

Use an explicit `type="submit"` for form submission. For navigation:

```tsx
<Button asChild variant="outline">
	<a href="/docs">Read documentation</a>
</Button>
```

This preserves link semantics. `variant="link"` alone is a visual button variant.
Native `disabled` does not disable links; do not promise otherwise. Inspect the
actual primitive semantics before migrating Radix or `render` call sites.

The web-local Radix Button and its stories have been removed. Global error and
not-found boundaries now import this shared Button. All new small UI primitives
must live in this package, not application-local duplicates; install missing
primitives here before use. Other local presentation remains outside this migration.

## Install and update

Run from `packages/components`:

```bash
bunx --bun shadcn@latest add @vandor/button --dry-run
bunx --bun shadcn@latest add @vandor/button --diff
bunx --bun shadcn@latest add @vandor/button
bunx --bun shadcn@latest add @vandor/button-stories
```

The package-local `@` alias is only an installer destination. Installed runtime
source uses relative imports, never web's alias. Add an explicit package export
for each additional public component. Review overwrite prompts and dependency
closure, retain licenses, and preserve local adaptations and TypeScript strictness.
Upstream stories need matching Storybook packages and their declared icon imports;
they do not install providers or modify the host.

Local adaptations: repository formatting, package exports, shared CSS registration,
and removal of the `autodocs` story tag because the host has no Docs addon.
Button's dark classes use `vandor-dark`, activated by an explicit `.dark` ancestor,
not the OS preference against light tokens. This scoped variant leaves existing
web-local `dark:` behavior untouched. Future dark themes must supply their own
tokens before activation. Button/LoadingArc interaction behavior is unchanged.

## Preview and verification

```bash
task dev:storybook
task build:storybook
bun --cwd packages/components run check-types
bun --cwd packages/components run lint
bun --no-env-file run scripts/check-shared-button.ts
```

Portable stories appear under `Vandor UI/Button`; the old `Web/UI/Button` group is
removed. They cover variants, sizes, disabled/loading, icons, link
composition, and no-press-motion states. Follow the [shared component rules](../../.agent/components.md)
and [verification policy](../../.agent/verification.md). Browser verification
requires an explicitly authorized Storybook server lifecycle; builds alone are
not visual acceptance. The explicit browser probe requires the existing server
on port 6006 and does not start or stop one. It covers loading, keyboard/focus,
link semantics, reduced motion, mobile overflow, and OS-dark/light-token isolation.
