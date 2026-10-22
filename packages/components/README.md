# Shared components

`@repo/components` owns editable React presentation source installed from
[Vandor UI](https://vandor-ui.vercel.app/llms-full.txt). The initial example is
Button, installed through the shadcn CLI together with its internal licensed
`loading-arc.tsx` dependency and optional portable stories. The public Loading
wrapper and its full registry snapshot of loading visuals are also installed.
No providers or application routes are installed by these components.

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
@import "@repo/brand/tokens.css";
@import "@repo/components/styles.css";
```

The stylesheet registers the package source with Tailwind 4 and exposes secondary,
accent, destructive, and input utilities. The consumer imports `@repo/brand/tokens.css` for the standard
background/foreground, primary, secondary, accent, muted, destructive, border,
input, and ring colors; the consumer owns radius and utility mappings. Web retains
the current light palette from brand; Storybook loads the same web stylesheet. No theme switch or
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

All application controls, including existing UI and stories, must use direct
`@repo/components/<name>` imports. Native controls, local primitive copies, and
direct Base UI/Radix imports belong only in this package. Structural HTML, forms,
links, SVG, and application feature compositions remain allowed outside it.
Missing primitives must be implemented/installed here first. Run
`task check:ui-primitives`; root/web typechecks include the static policy check.

## Input and Table contracts

`@repo/components/input` is a local static-label primitive informed by the inspected
Vandor Input API, not a full registry install or floating-label/icon implementation. It accepts native
input props, including React 19 `ref`, file selection, validation, autocomplete,
controlled/uncontrolled values and native change events. Optional `label` renders
an associated label, generating an ID when needed; `containerClassName` styles the
field wrapper. File inputs stay uncontrolled. Existing forms retain their IDs,
names, validation constraints and submission paths.

`@repo/components/table` provides small local semantic wrappers: `Table`,
`TableCaption`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`,
and `TableCell`. They accept their native element props; `TableHead` defaults to
`scope="col"`. Consumers own overflow containers, data, and navigation links.
This is not Vandor DataGrid and installs no sorting, pagination, Query or Zod
dependencies. Both primitives reuse the existing brand tokens without a new palette.

Colocated Input/Table stories cover field semantics, file selection, disabled/error
states, form submission, captions and long-content overflow. Application document
table/timeline stories exercise their migrated shared controls with local fixtures.
The explicit UI-only probe `bun --no-env-file run scripts/check-ui-primitive-stories.ts`
uses the permission-managed Storybook at port 6006; it never starts a service.

Primitive policy adoption (2026-10-23): component, web and Storybook typechecks
passed; the source checker found no application violations. Chromium inspected
21 affected stories at 1280px and 390px, with no document overflow or page errors.
Local form submission, ref/focus, disabled/error fields, file selection, upload
presentation stages, authentication constraints, and table/link semantics passed.
These are presentation fixtures, not proof of live authentication, upload/processing,
API-key management or settings persistence. Existing placeholder actions remain
placeholders; no backend capability was added.

## AppShell contract

`@repo/components/app-shell` is a presentation-only adaptation of Universe's
shared shell (originally based on `@7ovr/app-shell-3`). It accepts consumer-owned
navigation links, workspace/account slots, header content, and brand/actions.
Router links retain native browser semantics through Button `asChild`; disabled
destinations render disabled buttons, not disabled anchors. Collapse supports
controlled and uncontrolled state without width animation. Search, notifications,
contextual navigation animation, and fetching are not installed.

The shell uses shared `@repo/components/drawer` and `@repo/components/tooltip`.
Drawer is a deliberately scoped left-navigation adaptation of Vandor Drawer:
controlled state, title, trigger, close button, swipe dismissal and scrollable body.
It does not expose upstream imperative handles, snap points, or nested stack APIs.
Tooltip is a thin Base UI wrapper. Both use existing brand semantic utilities and
dependencies; no duplicate palette or application-local primitives are added.

Stories live under `Vandor UI/AppShell`; the integrated presentation is previewed
under `Web/Layouts/Workspace`. The explicitly invoked UI probe
`bun --no-env-file run scripts/check-app-shell.ts` uses an already-authorized
Storybook on port 6006 and never starts a backend. Typechecks and Storybook evidence
do not prove production authentication, persistence, realtime or redirect behavior.

## Loading contract

```tsx
import { Loading } from "@repo/components/loading";

<Loading aria-label="Loading documents" />
<Loading variant="text-dots" text="Preparing document" size={16} />
<Loading variant="bars" variantProps={{ bars: 5 }} size={32} />
```

The entrypoint also exports `LoadingProps`, `LoadingVariant`, and `loadingVariants`.
The 47 upstream variants use `size` (pixels or CSS length), optional `duration`
(CSS cycle seconds only), `text` for text variants, and typed `variantProps`.
The wrapper provides a labeled status and hides decorative internals from assistive
technology. Reduced motion substitutes a static visual or static text.

Button continues to import only `LoadingArc`, keeping the full variant catalog
out of Button's dependency graph. Public Loading uses the same Arc by default.
Internal `loading-ui` visuals are not public package entrypoints; use the wrapper
for consistent accessibility and reduced-motion behavior. Keep the bundled MIT
license in `src/components/loading-ui/LICENSE.md`.

## Install and update

Run from `packages/components`:

```bash
bunx --bun shadcn@latest add @vandor/button --dry-run
bunx --bun shadcn@latest add @vandor/button --diff
bunx --bun shadcn@latest add @vandor/button
bunx --bun shadcn@latest add @vandor/button-stories
bunx --bun shadcn@latest add @vandor/loading --dry-run
bunx --bun shadcn@latest add @vandor/loading
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
Loading's generated imports are made package-relative. The registry currently
has no `loading-stories` item; local colocated stories render the installed source.

## Preview and verification

```bash
task dev:storybook
task build:storybook
bun --cwd packages/components run check-types
bun --cwd packages/components run lint
bun --no-env-file run scripts/check-shared-button.ts
bun --no-env-file run scripts/check-shared-loading.ts
```

Portable stories appear under `Vandor UI/Button`; the old `Web/UI/Button` group is
removed. They cover variants, sizes, disabled/loading, icons, link
composition, and no-press-motion states. Follow the [shared component rules](../../.agent/components.md)
and [verification policy](../../.agent/verification.md). Browser verification
requires an explicitly authorized Storybook server lifecycle; builds alone are
not visual acceptance. The explicit browser probe requires the existing server
on port 6006 and does not start or stop one. It covers loading, keyboard/focus,
link semantics, reduced motion, mobile overflow, and OS-dark/light-token isolation.
Loading previews under `Vandor UI/Loading` cover all variants and common props.
The Loading browser probe checks desktop/mobile overflow, accessible status,
sizing/duration, variant options, reduced-motion fallback, and Button integration.
