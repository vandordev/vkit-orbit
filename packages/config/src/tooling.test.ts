import { expect, test } from "bun:test";
import { prismaToolEnvironment, webToolEnvironment } from "./tooling";
test("tool adapters emit only explicitly required fields", () => {
	expect(Object.keys(prismaToolEnvironment({ url: "postgresql://localhost/fixture_test", environment: "test" })).sort()).toEqual(["DATABASE_URL", "NODE_ENV"]);
	expect(webToolEnvironment({ app: { environment: "development", logLevel: "info" }, web: { host: "127.0.0.1", port: 4200, origin: "http://localhost:4200" } })).toEqual({ PORT: "4200", HOSTNAME: "127.0.0.1", NODE_ENV: "development" });
});
