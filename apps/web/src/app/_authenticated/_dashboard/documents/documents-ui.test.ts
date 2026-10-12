import { describe, expect, test } from "bun:test";

describe("document workspace UI contract", () => {
	test("has upload stages, supported formats, and recovery actions", async () => {
		const workflow = await Bun.file(new URL("./-components/upload-workflow.tsx", import.meta.url)).text();
		const timeline = await Bun.file(new URL("./-components/status-timeline.tsx", import.meta.url)).text();
		expect(workflow).toContain("Uploading document");
		expect(workflow).toContain("Analyzing document");
		expect(workflow).toContain(".txt");
		expect(workflow).toContain(".md");
		expect(timeline).toContain("Retry");
	});
});
