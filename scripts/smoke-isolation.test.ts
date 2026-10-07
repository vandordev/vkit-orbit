import { expect, test } from "bun:test";
import * as guard from "./smoke-isolation";

test("destructive smoke accepts only explicit isolated projects", () => {
	expect("assertSmokeIsolation" in guard).toBe(true);
	for (const env of [{}, { COMPOSE_PROJECT_NAME: "orbit-dev" }, { COMPOSE_PROJECT_NAME: "orbit-smoke-one" }]) {
		expect(() => guard.assertSmokeIsolation(env)).toThrow();
	}
	expect(guard.assertSmokeIsolation({ COMPOSE_PROJECT_NAME: "orbit-smoke-one", ORBIT_SMOKE_DISPOSABLE: "1" })).toBe("orbit-smoke-one");
});
