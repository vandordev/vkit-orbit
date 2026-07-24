import { expect, test } from "bun:test";

test("baseline has no example schedule or route", async () => {
	const sources = await Promise.all([
		Bun.file("README.md").text(),
		Bun.file("AGENTS.md").text(),
		Bun.file("config/scheduler.yaml").text(),
	]);
	const combined = sources.join("\n");

	expect(combined).not.toContain("ENABLE_EXAMPLE_SCHEDULE");
	expect(combined).not.toContain("EXAMPLE_SCHEDULE_INTERVAL_MS");
	expect(combined).not.toContain("/examples/realtime");
	expect(combined).toContain("recipes/realtime-notification");
});
