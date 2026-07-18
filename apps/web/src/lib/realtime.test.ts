import { describe, expect, test } from "bun:test";

import { bindRealtimeInvalidation } from "./realtime";

function fakeSocket() {
	const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
	return {
		on(name: string, listener: (...args: unknown[]) => void) { const set = listeners.get(name) ?? new Set(); set.add(listener); listeners.set(name, set); return this; },
		off(name: string, listener: (...args: unknown[]) => void) { listeners.get(name)?.delete(listener); return this; },
		emit(name: string, ...args: unknown[]) { for (const listener of listeners.get(name) ?? []) listener(...args); },
	};
}

describe("realtime invalidation", () => {
	test("invalidates queries after event and reconnect, then unsubscribes", async () => {
		const socket = fakeSocket();
		const invalidate = () => Promise.resolve();
		let count = 0;
		const unsubscribe = bindRealtimeInvalidation(socket, { invalidateQueries: () => { count += 1; return invalidate(); } });
		socket.emit("realtime-event", { type: "resource.updated" });
		socket.emit("connect");
		unsubscribe();
		socket.emit("connect");
		expect(count).toBe(2);
	});
});
