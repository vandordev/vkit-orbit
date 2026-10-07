import { spawn } from "node:child_process";
import { assertSmokeIsolation } from "./smoke-isolation";

assertSmokeIsolation();

const command = (args: string[]) =>
	new Promise<number>((resolve) => {
		const child = spawn(args[0]!, args.slice(1), { stdio: "inherit" });
		child.on("close", (code) => resolve(code ?? 1));
	});
const response = await fetch("http://127.0.0.1:4100/health").catch(() => undefined);
if (!response?.ok) {
	console.error("SKIPPED: real Compose web boundary is unavailable");
	process.exit(1);
}
if ((await command(["docker", "compose", "restart", "redis"])) !== 0) process.exit(1);
if ((await command(["docker", "compose", "exec", "-T", "redis", "redis-cli", "FLUSHALL"])) !== 0) process.exit(1);
if ((await command(["docker", "compose", "exec", "-T", "redis", "redis-cli", "PING"])) !== 0) process.exit(1);
if ((await command(["docker", "compose", "stop", "worker"])) !== 0) process.exit(1);
if ((await command(["docker", "compose", "run", "--rm", "worker", "bun", "apps/worker/src/compose-recovery-smoke.ts"])) !== 0)
	process.exit(1);
if ((await command(["docker", "compose", "start", "worker"])) !== 0) process.exit(1);
console.info("Redis restart, FLUSHALL, and PostgreSQL-driven current-stage reconstruction passed.");
