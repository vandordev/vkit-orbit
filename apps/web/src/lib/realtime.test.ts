import { describe, expect, test } from "bun:test";

import { bindRealtimeInvalidation, startRealtimeBridge } from "./realtime";

function fakeSocket() {
	const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
	return {
		on(name: string, listener: (...args: unknown[]) => void) {
			const set = listeners.get(name) ?? new Set();
			set.add(listener);
			listeners.set(name, set);
			return this;
		},
		off(name: string, listener: (...args: unknown[]) => void) {
			listeners.get(name)?.delete(listener);
			return this;
		},
		emit(name: string, ...args: unknown[]) {
			for (const listener of listeners.get(name) ?? []) listener(...args);
		},
	};
}

describe("realtime invalidation", () => {
	test("bridge waits for both values, blocks failures, and disposes replacement/unmount", () => {
		let connected = 0;
		let closed = 0;
		const urls: string[] = [];
		const factory = (input: { url: string; ticket: string }) => {
			urls.push(input.url);
			return { ...fakeSocket(), connect: () => { connected++; }, close: () => { closed++; } };
		};
		const queryClient = { invalidateQueries: () => undefined };
		const config = { realtimeUrl: "https://realtime.test" };
		const ticket = { ticket: "authenticated-ticket", workspaceId: "workspace" };
		expect(startRealtimeBridge({ ready: false, config, ticket }, queryClient, factory)).toBeUndefined();
		expect(startRealtimeBridge({ ready: true, config }, queryClient, factory)).toBeUndefined();
		expect(startRealtimeBridge({ ready: true, ticket }, queryClient, factory)).toBeUndefined();
		expect(connected).toBe(0);
		const dispose = startRealtimeBridge({ ready: true, config, ticket }, queryClient, factory);
		dispose?.();
		const replacement = startRealtimeBridge({ ready: true, config: { realtimeUrl: "https://replacement.test" }, ticket }, queryClient, factory);
		replacement?.();
		expect(urls).toEqual(["https://realtime.test", "https://replacement.test"]);
		expect(connected).toBe(2);
		expect(closed).toBe(2);
	});
	test("invalidates queries after event and reconnect, then unsubscribes", async () => {
		const socket = fakeSocket();
		const invalidate = () => Promise.resolve();
		let count = 0;
		const unsubscribe = bindRealtimeInvalidation(socket, {
			invalidateQueries: () => {
				count += 1;
				return invalidate();
			},
		});
		socket.emit("realtime-event", { type: "resource.updated" });
		socket.emit("connect");
		unsubscribe();
		socket.emit("connect");
		expect(count).toBe(2);
	});
});
