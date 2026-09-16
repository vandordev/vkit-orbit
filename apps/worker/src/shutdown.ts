export function createShutdown(disconnect: () => Promise<void>, stop: () => Promise<void> | void, timeoutMs = 10_000) {
	let closing = false;
	return async () => {
		if (closing) return;
		closing = true;
		await Promise.race([Promise.resolve(stop()), new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
		await disconnect();
	};
}
