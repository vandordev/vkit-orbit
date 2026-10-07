import { runOutboxRelay } from "./relay";
export function startRelayLoop(run: () => Promise<unknown>, intervalMs = 500) {
	let stopped = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let pending: Promise<unknown> = Promise.resolve();
	const tick = async () => {
		if (!stopped) {
			pending = run().catch(() => undefined);
			await pending;
			if (!stopped) timer = setTimeout(tick, intervalMs);
		}
	};
	void tick();
	return async () => {
		stopped = true;
		clearTimeout(timer);
		await pending;
	};
}
export { runOutboxRelay };
