import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
test("Redis preserves durable options, protocol and isolated test prefix", () => {
	expect(loadRuntimeConfig("scheduler", { environment: { REDIS_URL: "redis://redis:6379", REDIS_KEY_PREFIX: "hub:", REDIS_CONNECT_TIMEOUT_MS: "2500" } }).redis).toEqual({ url: "redis://redis:6379", keyPrefix: "hub:", connectTimeoutMs: 2500, maxRetriesPerRequest: null });
	for (const environment of [{ NODE_ENV: "test" }, { NODE_ENV: "test", REDIS_KEY_PREFIX: "orbit:test" }, { REDIS_URL: "https://redis.test" }]) expect(() => loadRuntimeConfig("scheduler", { environment })).toThrow();
	expect(loadRuntimeConfig("scheduler", { environment: { NODE_ENV: "test", REDIS_KEY_PREFIX: "orbit:test:one" } }).redis.keyPrefix).toBe("orbit:test:one");
});
