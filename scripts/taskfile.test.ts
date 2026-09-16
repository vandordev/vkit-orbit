import { expect, test } from "bun:test";

const taskfile = await Bun.file("Taskfile.yml").text();

test("Taskfile exposes the TypeScript runtime operations", () => {
	for (const task of [
		"doctor",
		"install",
		"migrate",
		"build",
		"quality",
		"dev",
		"dev:web",
		"dev:worker",
		"dev:scheduler",
		"dev:realtime",
		"db:generate",
		"compose:up",
		"compose:down",
	]) {
		expect(taskfile).toContain(`  ${task}:`);
	}
});

test("dev runs the web foreground", () => {
	const devTask = taskfile.slice(taskfile.indexOf("  dev:"), taskfile.indexOf("\n  dev:web:"));
	expect(devTask).toContain("bun run dev:web");
});

test("Taskfile leaves command wrappers to each developer", () => {
	expect(taskfile).not.toContain(["r", "t", "k"].join(""));
});

test("migrate starts only Prisma deployment", () => {
	const migrateTask = taskfile.slice(taskfile.indexOf("  migrate:"), taskfile.indexOf("\n  test:"));
	expect(migrateTask).toContain("bun run start:migrate");
	expect(migrateTask).not.toContain("River");
});
