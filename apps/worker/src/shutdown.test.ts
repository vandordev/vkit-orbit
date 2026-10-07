import { expect, test } from "bun:test";
import { createShutdown } from "./shutdown";

test("shutdown always disconnects resources after a stop failure", async () => {
	let disconnected = false;
	const shutdown = createShutdown(
		async () => {
			disconnected = true;
		},
		async () => {
			throw new Error("stop failed");
		},
		10,
	);
	await expect(shutdown()).rejects.toThrow("stop failed");
	expect(disconnected).toBe(true);
});
