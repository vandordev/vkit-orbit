import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
const environment = { DATABASE_URL: "postgresql://localhost/fixture_test", WORKER_NOTIFICATION_API_KEY: "fixture", NODE_ENV: "test", REDIS_KEY_PREFIX: "orbit:test:worker" };
test("worker selects app, storage and notification without realtime credentials", () => {
	expect(loadRuntimeConfig("worker", { environment }).app.environment).toBe("test");
	expect(loadRuntimeConfig("worker", { environment: { ...environment, S3_BUCKET: "uploads", S3_ACCESS_KEY_ID: "id", S3_SECRET_ACCESS_KEY: "secret" } }).storage).toMatchObject({ bucket: "uploads", rootPrefix: "uploads" });
	expect(loadRuntimeConfig("worker", { environment })).not.toHaveProperty("realtime");
	expect(() => loadRuntimeConfig("worker", { environment: { ...environment, WORKER_NOTIFICATION_API_KEY: "" } })).toThrow();
});
