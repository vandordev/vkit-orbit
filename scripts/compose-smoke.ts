import { spawn } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { assertSmokeIsolation } from "./smoke-isolation";

const project = `orbit-smoke-${randomBytes(6).toString("hex")}`;
const directory = await mkdtemp("/tmp/opencode/orbit-smoke-");
const override = `${directory}/compose.yaml`;
const encryptionKey = randomBytes(32).toString("hex");
// Reset env_file so the smoke never uses the developer's ignored .env.
await writeFile(
	override,
	`services:\n${["web", "api", "worker", "scheduler", "realtime"].map((service) => `  ${service}:\n    env_file: !reset []\n    environment:\n      WEBHOOK_SECRET_ENCRYPTION_KEY: ${encryptionKey}\n      REDIS_KEY_PREFIX: orbit:test:${project}\n`).join("")}`,
	{ mode: 0o600 },
);
const environment = {
	...Object.fromEntries(
		Object.entries(process.env).filter(([key]) =>
			["PATH", "HOME", "DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_CONFIG", "XDG_RUNTIME_DIR", "TMPDIR"].includes(key),
		),
	),
	COMPOSE_PROJECT_NAME: project,
	COMPOSE_FILE: `${process.cwd()}/docker-compose.yml:${override}`,
	COMPOSE_ENV_FILES: "/dev/null",
	COMPOSE_DISABLE_ENV_FILE: "1",
	ORBIT_SMOKE_DISPOSABLE: "1",
};
assertSmokeIsolation(environment);

const timeoutMs = 120_000;
const command = (args: string[]) =>
	new Promise<number>((resolve) => {
		const child = spawn(args[0]!, args.slice(1), { stdio: "inherit", env: environment });
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
	await command(["docker", "compose", "down", "--remove-orphans", "--volumes"]);
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
	if ((await command(["docker", "compose", "restart", "worker"])) !== 0) throw new Error("worker restart scenario failed");
	if ((await command(["docker", "compose", "exec", "-T", "worker", "bun", "apps/worker/src/compose-system-smoke.ts"])) !== 0)
		throw new Error("real public API, storage, worker, or authorization scenario failed");
	if ((await command(["bun", "run", "scripts/redis-recovery-smoke.ts"])) !== 0)
		throw new Error("Redis recovery scenario failed or was skipped");
	await cleanup();
} catch (error) {
	console.error(error);
	await cleanup();
	process.exit(1);
}
