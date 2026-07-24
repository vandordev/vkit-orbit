import { expect, test } from "bun:test";

test("recipe keeps the versioned example payload", async () => {
	const source = await Bun.file(new URL("../files/packages/queue/src/example-realtime-notification.ts", import.meta.url)).text();

	expect(source).toContain('"example.realtime-notification.v1"');
	expect(source).toContain("resourceId");
	expect(source).toContain("workspaceId");
});
