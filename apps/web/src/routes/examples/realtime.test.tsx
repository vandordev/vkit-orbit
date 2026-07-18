import { expect, test } from "bun:test";

test("documents the opt-in realtime walkthrough and cleanup contract", async () => {
	const source = await Bun.file(new URL("./realtime.tsx", import.meta.url)).text();
	expect(source).toContain("opt-in");
	expect(source).toContain("createRealtimeSocket");
	expect(source).toContain("close");
});
