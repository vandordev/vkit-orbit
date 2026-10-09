import { expect, test } from "bun:test";
import { loadRuntimeConfig } from "./runtime";
const environment = { DATABASE_URL: "postgresql://localhost/fixture_test" };
test("API listener and OpenAPI defaults use standalone port and scoped fields", () => {
	expect(loadRuntimeConfig("api", { environment }).api).toMatchObject({ port: 4101, corsOrigin: "http://localhost:4100", openapi: { serverUrl: "http://localhost:4101" } });
	expect(loadRuntimeConfig("api", { environment: { ...environment, OPENAPI_SERVER_URL: "https://api.example.com" } }).api.openapi.serverUrl).toBe("https://api.example.com");
});
test("API rejects missing database and partial documentation credentials", () => {
	expect(() => loadRuntimeConfig("api", { environment: {} })).toThrow("DATABASE_URL");
	expect(() => loadRuntimeConfig("api", { environment: { ...environment, OPENAPI_BASIC_AUTH_USERNAME: "docs" } })).toThrow();
});
