import { expect, test } from "bun:test";

const taskfile = await Bun.file("Taskfile.yml").text();

test("Taskfile exposes the hybrid runtime operations", () => {
	for (const task of [
		"doctor", "install", "migrate", "build", "build:go", "quality", "dev",
		"dev:bg", "dev:web", "dev:worker", "dev:scheduler", "dev:realtime", "start:jobs",
		"test:go", "db:generate", "compose:up", "compose:jobs", "compose:realtime", "compose:down", "web:health",
	]) {
		expect(taskfile).toContain(`  ${task}:`);
	}
});

test("dev follows the web foreground and background-runtime split", () => {
	const devTask = taskfile.slice(taskfile.indexOf("  dev:"), taskfile.indexOf("\n  dev:web:"));
	expect(devTask).toContain('desc: Run TanStack Start with embedded Elysia');
	expect(devTask).toContain("rtk bun run dev:web");
	expect(devTask).toContain("  dev:bg:");
	expect(devTask).toContain("dev:worker");
	expect(devTask).toContain("dev:scheduler");
	expect(devTask).toContain("dev:realtime");
});

test("migrate loads base configuration before starting the Go runtime", () => {
	const migrateTask = taskfile.slice(taskfile.indexOf("  migrate:"), taskfile.indexOf("\n  test:"));
	expect(migrateTask).toContain("packages/config/src/run.ts --modules base -- go run ./apps/migrate");
});
