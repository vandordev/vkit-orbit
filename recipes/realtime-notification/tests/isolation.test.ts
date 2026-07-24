import { expect, test } from "bun:test";

test("recipe contains each explicit integration source", async () => {
	const files = [
		"apps/api/src/routes/examples.ts",
		"apps/scheduler/src/schedules.ts",
		"apps/worker/internal/worker/example_realtime_notification.go",
		"apps/web/src/routes/examples/realtime.tsx",
		"integration/api.md",
		"integration/scheduler.md",
		"integration/worker.md",
		"integration/web.md",
	];
	const sources = await Promise.all(files.map((file) => Bun.file(new URL(`../files/${file}`, import.meta.url)).text()));

	expect(sources[0]).toContain("createExampleRoutes");
	expect(sources[1]).toContain("registerSchedules");
	expect(sources[2]).toContain("ExampleRealtimeNotificationWorker");
	expect(sources[2]).toContain("Notifier.Notify");
	expect(sources[3]).toContain("createRealtimeSocket");
	expect(sources[3]).toContain("close");
});
