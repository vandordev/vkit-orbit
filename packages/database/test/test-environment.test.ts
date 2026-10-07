import { expect, test } from "bun:test";
import * as guard from "../src/test-environment";

test("test database guard rejects development targets and does not fall back", () => {
	expect(() => guard.loadTestEnvironment({ DATABASE_URL: "postgresql://test:test@localhost/development" })).toThrow("TEST_DATABASE_URL");
	for (const url of ["postgresql://test:test@localhost/development", "redis://localhost/orbit_test", "not-a-url"]) {
		expect(() => guard.loadTestEnvironment({ TEST_DATABASE_URL: url })).toThrow();
	}
	expect(guard.loadTestEnvironment({ TEST_DATABASE_URL: "postgresql://test:test@localhost/orbit_test" }).DATABASE_URL).toBe(
		"postgresql://test:test@localhost/orbit_test",
	);
});
