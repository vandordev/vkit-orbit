import { resolve } from "node:path";
import { loadDatabaseConfig, loadRuntimeConfig, loadWebToolConfig } from "./runtime";
import { configFilePath, setApplicationRoot } from "./paths";
import { prismaToolEnvironment, webToolEnvironment } from "./tooling";
import type { RuntimeName } from "./schemas";

export type RunConfiguredCommandOptions = {
	command: readonly string[];
	runtime: RuntimeName;
	root?: string;
	tool?: "vite" | "prisma";
	environment?: Record<string, string | undefined>;
	stdio?: "inherit" | "pipe";
};
export type ConfiguredCommandResult = { exitCode: number; stderr: string; stdout: string };

export async function runConfiguredCommand({ command, runtime, root, tool, environment = process.env, stdio = "pipe" }: RunConfiguredCommandOptions): Promise<ConfiguredCommandResult> {
	if (!command.length) throw new Error("A command is required after --");
	if (root) setApplicationRoot(root);
	const applicationRoot = resolve(configFilePath(), "../..");
	const options = { filePath: configFilePath(), environment };
	// Nitro does not own a separate config bootstrap: validate the full web
	// subset here before its generated server can open a listener. Vite is a
	// tooling-only invocation and receives just listener settings.
	if (runtime === "web" && tool !== "vite") loadRuntimeConfig("web", options);
	const web = runtime === "web" ? loadWebToolConfig(options) : undefined;
	const settings = web ? webToolEnvironment(web) : tool === "prisma" ? prismaToolEnvironment(loadDatabaseConfig(options)) : {};
	// Tools need narrow listener/database settings, not a flattened config bus.
	// Other runtimes validate their own subset in the child before opening resources.
	const executable = command[0];
	if (executable !== "bun" && executable !== process.execPath) throw new Error("Configured commands must use Bun with env-file discovery disabled");
	const args = [...command.slice(1)];
	if (tool === "vite") {
		if (!web) throw new Error("Vite adapter requires web runtime");
		args.push("--host", web.web.host, "--port", String(web.web.port));
	}
	const child = Bun.spawn({ cmd: [process.execPath, "--no-env-file", ...args], env: { ...environment, ...settings, ORBIT_APPLICATION_ROOT: applicationRoot }, stdin: "inherit", stderr: stdio, stdout: stdio });
	if (stdio === "inherit") return { exitCode: await child.exited, stderr: "", stdout: "" };
	const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
	return { exitCode, stderr, stdout };
}

const runtimes: readonly RuntimeName[] = ["web", "api", "worker", "scheduler", "realtime", "migrate"];
function parseRuntime(value: string | undefined): RuntimeName {
	const runtime = runtimes.find(runtime => runtime === value);
	if (!runtime) throw new Error("Expected --runtime web|api|worker|scheduler|realtime|migrate");
	return runtime;
}
if (import.meta.main) {
	const args = process.argv.slice(2);
	const separator = args.indexOf("--");
	if (separator < 0) throw new Error("Expected -- followed by a Bun command");
	const flags = args.slice(0, separator);
	const flag = (name: string) => { const index = flags.indexOf(name); return index < 0 ? undefined : flags[index + 1]; };
	const runtime = parseRuntime(flag("--runtime"));
	const toolValue = flag("--tool");
	if (toolValue !== undefined && toolValue !== "vite" && toolValue !== "prisma") throw new Error("Unknown tooling adapter");
	process.exitCode = (await runConfiguredCommand({ runtime, root: flag("--root"), tool: toolValue, command: args.slice(separator + 1), stdio: "inherit" })).exitCode;
}
