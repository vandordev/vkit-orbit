import { expect, test } from "bun:test";

test("baseline scheduler has no example schedule registration", async () => {
	const source = await Bun.file(new URL("./main.ts", import.meta.url)).text();

	expect(source).not.toContain("registerSchedules");
	expect(source).not.toContain("exampleRealtimeNotificationJob");
	expect(source).not.toContain("setInterval");
});
