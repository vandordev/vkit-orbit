import { getDatabaseConfig, prismaToolEnvironment } from "@repo/config/server";
import { fileURLToPath } from "node:url";
if (import.meta.main) {
	const child = Bun.spawn({ cmd: [process.execPath, "--no-env-file", "run", "db:migrate"], cwd: fileURLToPath(new URL("../../../packages/db", import.meta.url)), env: { ...process.env, ...prismaToolEnvironment(getDatabaseConfig()) }, stdin: "inherit", stdout: "inherit", stderr: "inherit" });
	process.exitCode = await child.exited;
}
