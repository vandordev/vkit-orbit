type SchedulerRuntimeInput = {
	register?: () => () => void;
	waitForShutdown?: () => Promise<void>;
	disconnect: () => Promise<void>;
};

export function waitForTermination(): Promise<void> {
	return new Promise((resolve) => {
		const shutdown = () => {
			process.removeListener("SIGINT", shutdown);
			process.removeListener("SIGTERM", shutdown);
			resolve();
		};

		process.once("SIGINT", shutdown);
		process.once("SIGTERM", shutdown);
	});
}

export async function runScheduler({ register = () => () => {}, waitForShutdown = waitForTermination, disconnect }: SchedulerRuntimeInput): Promise<void> {
	const cleanup = register();
	try {
		await waitForShutdown();
	} finally {
		cleanup();
		await disconnect();
	}
}
