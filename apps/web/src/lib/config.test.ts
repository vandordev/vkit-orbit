import { describe, expect, test } from "bun:test";

import { appConfig } from "./config";

describe("web app config", () => {
	test("exposes the default brand configuration", () => {
		expect(appConfig).toEqual({
			appName: "Vkit Orbit",
			defaultTitle: "Vkit Orbit",
			defaultDescription: "A focused workspace for turning plain text into useful document insights.",
			favicon: "/favicon.ico",
			repositoryUrl: "https://github.com/vandordev/vx",
		});
	});
});
