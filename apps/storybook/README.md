# Repository Storybook

`@repo/storybook` is the shared React/Vite preview host. Stories stay next to
the components they demonstrate in `apps` and `packages`, not copied here.

```bash
task dev:storybook
task build:storybook
```

Development uses `http://127.0.0.1:6006`. CI mode refuses an occupied port rather
than selecting a fallback. Static output is ignored at `apps/storybook/storybook-static`.
Storybook is development tooling, not a Compose/deployed product runtime.
Commands do not load `.env` or provision PostgreSQL/Redis.

## Discovery and styling

`.storybook/discovery.ts` discovers repository-wide `*.stories.tsx`, excluding
dependencies and generated outputs. Each file is registered individually. New
story files require a server restart to refresh discovery; existing edits use HMR.
Use unique CSF titles. This host supports React only.

Preview imports the actual `apps/web/src/styles.css`, with explicit Tailwind
sources for web and packages. It retains the existing light theme, without
inventing dark tokens or redesigning components. The `@` alias resolves to web's
`src` for existing components. Future shared packages should use their own public
entrypoints/relative internal imports, not the web alias. If source/styles move,
update preview paths and Tailwind sources accordingly.

Stories are typechecked/linted by their owning workspace; the host checks its
configuration and discovery tests. `task build` includes the Storybook workspace
build. Its Turbo build cache is disabled because discovery spans workspaces beyond
its declared dependency graph.

## Component-driven workflow

Follow [verification policy](../../.agent/verification.md): check schema and runtime
feasibility, build typed presentation components with stories, verify them here,
then integrate fetching/auth/navigation in route adapters. Pages/layouts use
`Web/Pages/<Area>/<Page>` and `Web/Layouts/<Layout>` titles under route-local
`-components`. The initial `Web/UI/Button` stories render the real existing Button;
existing routes are not migrated by this installation.

Fixtures are deterministic and local, respecting actual schema/runtime contracts.
Stories compose their own providers when needed, never production credentials
or real authenticated APIs. Review relevant states, copy, keyboard/focus,
interactions, and mobile overflow. Build/typecheck alone are not visual acceptance.

## Agent server lifecycle

Check existing `http://localhost:6006` before UI verification. If absent or stale,
ask whether the user will start/restart it or authorizes the agent to act.
For an authorized start/restart, inspect all Storybook processes/listeners,
identify the old project instance, stop it and confirm exit before starting
`task dev:storybook`. Verify exactly one server, including possible duplicates
on other ports. Never broadly kill unrelated processes, choose another port, or
substitute an alternate dev/static preview. Ask if ownership is unclear.

## Focused checks

```bash
bun --no-env-file test apps/storybook/test
bun --cwd apps/storybook run check-types
bun --cwd apps/web run check-types
task build:storybook
```

Run only checks relevant to the changed boundary. Storybook/browser checks do not
establish production auth or backend integration behavior.
