import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

let applicationRoot: string | undefined;
export function setApplicationRoot(root: string): void { applicationRoot = resolve(root); }
export function configFilePath(): string {
	if (applicationRoot) return join(applicationRoot, "config/config.yaml");
	let directory = dirname(fileURLToPath(import.meta.url));
	while (true) {
		if (existsSync(join(directory, "config/config.yaml"))) return join(directory, "config/config.yaml");
		const parent = dirname(directory);
		if (parent === directory) throw new Error("Trusted application root required for configuration");
		directory = parent;
	}
}
