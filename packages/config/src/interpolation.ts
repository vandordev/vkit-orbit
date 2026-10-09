import { configError, type Diagnostic } from "./errors";

type Environment = Readonly<Record<string, string | undefined>>;

// Scan the original string only. Inserted environment values are never scanned.
function scan(value: string, environment: Environment | undefined, diagnostic: Diagnostic, path: readonly string[]): string {
	let output = "";
	for (let i = 0; i < value.length;) {
		if (value.startsWith("$${", i)) { output += "${"; i += 3; continue; }
		if (!value.startsWith("${", i)) { output += value[i]; i++; continue; }
		const end = value.indexOf("}", i + 2);
		if (end < 0) throw configError(diagnostic, path, "malformed template");
		const body = value.slice(i + 2, end);
		const match = /^([A-Z][A-Z0-9_]*)(?::-(.*))?$/s.exec(body);
		if (!match || body.includes("${") || body.includes("{")) throw configError(diagnostic, path, "malformed template");
		const name = match[1];
		if (!name) throw configError(diagnostic, path, "malformed template");
		if (environment) {
			const resolved = environment[name];
			if (resolved !== undefined && resolved !== "") output += resolved;
			else if (match[2] !== undefined) output += match[2];
			else throw configError(diagnostic, path, `missing environment variable ${name}`);
		}
		i = end + 1;
	}
	return output;
}

export function validateTemplates(value: unknown, diagnostic: Diagnostic, path: readonly string[] = []): void {
	if (typeof value === "string") { scan(value, undefined, diagnostic, path); return; }
	if (value && typeof value === "object") for (const [key, nested] of Object.entries(value)) {
		if (key.includes("${")) throw configError(diagnostic, path, "templated keys are forbidden");
		validateTemplates(nested, diagnostic, [...path, key]);
	}
}

export function interpolateSelected(value: unknown, environment: Environment, diagnostic: Diagnostic, path: readonly string[] = []): unknown {
	if (typeof value === "string") return scan(value, environment, diagnostic, path);
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, interpolateSelected(nested, environment, diagnostic, [...path, key])]));
	return value;
}
