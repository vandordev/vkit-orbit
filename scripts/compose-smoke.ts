import { spawn } from "node:child_process";

const timeoutMs = 120_000;
const command = (args: string[]) =>
	new Promise<number>((resolve) => {
		const child = spawn(args[0]!, args.slice(1), { stdio: "inherit" });
		child.on("close", (code) => resolve(code ?? 1));
	});
async function health(url: string, deadline: number): Promise<void> {
	while (Date.now() < deadline) {
		try {
			if ((await fetch(url)).ok) return;
		} catch {
			/* dependency is still starting */
		}
		await Bun.sleep(1000);
	}
	throw new Error(`health timeout: ${url}`);
}

let cleaned = false;
// Signal handlers are the Bun equivalent of a shell cleanup trap.
async function cleanup() {
	if (cleaned) return;
	cleaned = true;
	await command(["docker", "compose", "down", "--remove-orphans"]);
}
process.once("SIGINT", async () => {
	await cleanup();
	process.exit(130);
});
process.once("SIGTERM", async () => {
	await cleanup();
	process.exit(143);
});

try {
	if ((await command(["docker", "compose", "up", "--build", "-d"])) !== 0) throw new Error("compose startup failed");
	const deadline = Date.now() + timeoutMs;
	for (const url of ["http://127.0.0.1:4100/health", "http://127.0.0.1:4101/health/live", "http://127.0.0.1:4102/health"])
		await health(url, deadline);
	if ((await command(["bunx", "playwright", "test", "--config", "apps/web/playwright.config.ts"])) !== 0)
		throw new Error("Playwright scenario failed or was SKIPPED");
	if ((await command(["bun", "run", "scripts/redis-recovery-smoke.ts"])) !== 0)
		throw new Error("Redis recovery scenario failed or was skipped");
	await cleanup();
} catch (error) {
	console.error(error);
	await cleanup();
	process.exit(1);
}
