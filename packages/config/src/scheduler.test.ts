import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
test("scheduler selects only app and Redis, never database or example schedules", () => {
	const config = loadRuntimeConfig("scheduler", { environment: {} });
	expect(Object.keys(config).sort()).toEqual(["app", "redis"]);
	expect(config).not.toHaveProperty("ENABLE_EXAMPLE_SCHEDULE");
	expect(config).not.toHaveProperty("EXAMPLE_SCHEDULE_INTERVAL_MS");
});
