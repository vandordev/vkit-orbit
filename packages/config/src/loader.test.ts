import { expect, test } from "bun:test";
import { loadConfigDocument } from "./loader";
import { configFilePath } from "./paths";
import { loadRuntimeConfig } from "./runtime";
test("parses the one document before any required interpolation", () => {
	expect(loadConfigDocument(configFilePath()).database.url).toBe("${DATABASE_URL}");
	expect(() => loadConfigDocument("/tmp/opencode/absent-config.yaml")).toThrow("cannot read document");
});
test("selected string values are literal, not parsed as YAML or recursively expanded", () => {
	const password = "x:#\n${SECOND}";
	expect(loadRuntimeConfig("realtime", { environment: { REALTIME_TICKET_SECRET: password, REALTIME_PUBLISH_API_KEY: "fixture" } }).realtime.ticketSecret).toBe(password);
});
