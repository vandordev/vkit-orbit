import { expect, test } from "bun:test";

const taskfile = await Bun.file("Taskfile.yml").text();

test("Taskfile exposes the hybrid runtime operations", () => {
	for (const task of [
		"doctor", "install", "migrate", "build", "build:go", "quality", "dev",
		"dev:web", "dev:worker", "dev:scheduler", "dev:realtime", "start:jobs",
		"test:go", "db:generate", "compose:up", "compose:jobs", "compose:realtime", "compose:down", "web:health",
	]) {
		expect(taskfile).toContain(`  ${task}:`);
	}
});
