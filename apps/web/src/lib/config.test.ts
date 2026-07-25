import { describe, expect, test } from "bun:test";

import { appConfig } from "./config";

describe("web app config", () => {
	test("exposes the default brand configuration", () => {
		expect(appConfig).toEqual({
			appName: "Vkit Orbit",
			defaultTitle: "Vkit Orbit",
			defaultDescription: "A domain-neutral boilerplate for TanStack Start, embedded Elysia, Prisma, River, and Go workers.",
			favicon: "/favicon.ico",
			repositoryUrl: "https://github.com/vandordev/vx",
		});
	});
});
