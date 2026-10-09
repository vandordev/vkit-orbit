import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
test("database runtime requires explicit URL, including production", () => {
	expect(() => loadRuntimeConfig("migrate", { environment: { NODE_ENV: "production" } })).toThrow("DATABASE_URL");
	expect(loadRuntimeConfig("migrate", { environment: { DATABASE_URL: "postgresql://localhost/fixture_test" } }).database.url).toBe("postgresql://localhost/fixture_test");
});
