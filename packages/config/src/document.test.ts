import { expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfigDocument } from "./loader";
import { configFilePath } from "./paths";
test("rejects forbidden YAML features and unknown keys", () => {
	const directory = mkdtempSync("/tmp/opencode/config-");
	try {
		const filePath = join(directory, "config.yaml");
		const original = readFileSync(configFilePath(), "utf8");
		for (const source of ["app: []", "app: {}\napp: {}", "---\napp: {}\n---\napp: {}", "app: &app {}", "app: *app", "app: !execute {}", `${original}\ntypo: true`, original.replace("logLevel:", "logLevell:")]) {
			writeFileSync(filePath, source);
			expect(() => loadConfigDocument(filePath)).toThrow("Configuration");
		}
	} finally { rmSync(directory, { recursive: true, force: true }); }
});
