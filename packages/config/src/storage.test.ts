import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
const environment = { DATABASE_URL: "postgresql://localhost/fixture_test" };
test("maps complete optional storage and rejects partial credentials", () => {
	expect(loadRuntimeConfig("api", { environment }).storage).toBeNull();
	expect(loadRuntimeConfig("api", { environment: { ...environment, S3_BUCKET: "uploads", S3_ACCESS_KEY_ID: "id", S3_SECRET_ACCESS_KEY: "secret" } }).storage).toMatchObject({ bucket: "uploads", rootPrefix: "uploads" });
	expect(() => loadRuntimeConfig("api", { environment: { ...environment, S3_BUCKET: "uploads" } })).toThrow();
});
