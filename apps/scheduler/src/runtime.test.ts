import { expect, test } from "bun:test";

import { runScheduler } from "./runtime";

test("keeps an idle scheduler alive until shutdown and then cleans up", async () => {
	let resolveShutdown!: () => void;
	let cleaned = false;
	const running = runScheduler({
		register: () => () => {
			cleaned = true;
		},
		waitForShutdown: () =>
			new Promise<void>((resolve) => {
				resolveShutdown = resolve;
			}),
		disconnect: async () => {},
	});

	await Bun.sleep(0);
	expect(cleaned).toBe(false);
	resolveShutdown();
	await running;
	expect(cleaned).toBe(true);
});
