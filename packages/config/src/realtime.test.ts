import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
test("realtime requires listener credentials but not database or browser URL", () => {
	const config = loadRuntimeConfig("realtime", { environment: { REALTIME_TICKET_SECRET: "ticket", REALTIME_PUBLISH_API_KEY: "publisher" } });
	expect(config.realtime.port).toBe(4102);
	expect(config).not.toHaveProperty("database");
	expect(config.realtime).not.toHaveProperty("publicUrl");
});
