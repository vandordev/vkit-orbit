import { expect, test } from "bun:test";
import { loadRuntimeConfig, loadPublicWebConfig } from "./runtime";
test("isolates runtime fields and unrelated secrets", () => {
	expect(loadRuntimeConfig("scheduler", { environment: {} })).not.toHaveProperty("database");
	expect(loadRuntimeConfig("realtime", { environment: { REALTIME_TICKET_SECRET: "ticket", REALTIME_PUBLISH_API_KEY: "publisher" } })).not.toHaveProperty("database");
	expect(loadRuntimeConfig("migrate", { environment: { DATABASE_URL: "postgresql://localhost/fixture_test" } }).database.url).toContain("fixture_test");
	expect(loadPublicWebConfig({ environment: {} })).toEqual({ realtimeUrl: "http://localhost:4102" });
	expect(() => loadPublicWebConfig({ environment: { NODE_ENV: "production" } })).toThrow("REALTIME_URL");
	for (const REALTIME_URL of ["http://user:pass@localhost", "http://localhost/#fragment", "http://localhost/path"]) expect(() => loadPublicWebConfig({ environment: { REALTIME_URL } })).toThrow();
});
test("preserves storage, publisher, numeric and Redis constraints", () => {
	const environment = { DATABASE_URL: "postgresql://localhost/fixture_test" };
	for (const WEB_PORT of ["", " ", "0", "65536", "1.5"]) {
		if (WEB_PORT === "") continue; // YAML supplies its declared empty-env fallback.
		expect(() => loadRuntimeConfig("web", { environment: { ...environment, REALTIME_TICKET_SECRET: "ticket", WEB_PORT } })).toThrow();
	}
	expect(() => loadRuntimeConfig("api", { environment: { ...environment, S3_BUCKET: "partial" } })).toThrow();
	expect(() => loadRuntimeConfig("api", { environment: { ...environment, WORKER_NOTIFICATION_API_KEY: "partial" } })).toThrow();
	expect(() => loadRuntimeConfig("scheduler", { environment: { NODE_ENV: "test" } })).toThrow("isolated");
});
