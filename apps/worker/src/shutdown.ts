export function createShutdown(disconnect: () => Promise<void>, stop: () => Promise<void> | void, timeoutMs = 10_000) {
	let closing = false;
	return async () => {
		if (closing) return;
		closing = true;
		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			await Promise.race([
				Promise.resolve().then(stop),
				new Promise<void>((resolve) => {
					timer = setTimeout(resolve, timeoutMs);
				}),
			]);
		} finally {
			clearTimeout(timer);
			await disconnect();
		}
	};
}
