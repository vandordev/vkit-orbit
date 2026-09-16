import { runOutboxRelay } from "./relay";
export function startRelayLoop(run: () => Promise<unknown>, intervalMs = 500) {
	let stopped = false;
	const tick = async () => {
		if (!stopped) {
			await run();
			setTimeout(tick, intervalMs);
		}
	};
	void tick();
	return () => {
		stopped = true;
	};
}
export { runOutboxRelay };
