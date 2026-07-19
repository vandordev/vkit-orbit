# Contributing

Read `AGENTS.md` and the relevant files in `.agent/` before changing the repository.

Keep the public runtime focused on `apps/web` with embedded `apps/api`. The baseline also includes the optional jobs/realtime runtimes: `apps/worker`, `apps/scheduler`, `packages/queue`, and `apps/realtime`. They are disabled from the default Compose topology or default schedule unless explicitly selected.

Before opening a change, run:

```bash
task quality
task build
```

Use focused tests while developing. Keep changes scoped to the owning workspace, update documentation when reusable architecture changes, and do not commit secrets or local environment files.
