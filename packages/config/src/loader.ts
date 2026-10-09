import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { parseAllDocuments, visit, isAlias, isScalar } from "yaml";
import { validateConfigDocument, type RawConfigDocument } from "./document";
import { configError } from "./errors";

export function loadConfigDocument(filePath: string): RawConfigDocument {
	const diagnostic = { filePath, runtime: "structure" };
	let source: string;
	try { source = readFileSync(filePath, "utf8"); } catch { throw configError(diagnostic, [], "cannot read document"); }
	const documents = parseAllDocuments(source, { version: "1.2", uniqueKeys: true, stringKeys: true, strict: true });
	const document = documents[0];
	if (documents.length !== 1 || !document || document.errors.length || document.warnings.length) throw configError(diagnostic, [], "invalid YAML document");
	visit(document, (_key, node) => {
		if (isAlias(node) || (node && typeof node === "object" && (("anchor" in node && node.anchor) || ("tag" in node && node.tag)))) throw configError(diagnostic, [], "aliases, anchors and explicit tags are forbidden");
		if (isScalar(node) && node.value === "<<") throw configError(diagnostic, [], "merge keys are forbidden");
	});
	return validateConfigDocument(document.toJS({ maxAliasCount: 0 }), diagnostic);
}

export type LoadConfigOptions = {
	configDirectory?: string;
	modules: readonly string[];
	environment: Record<string, string | undefined>;
};

type ConfigRecord = Record<string, unknown>;

const moduleNamePattern = /^[a-z][a-z0-9-]*$/;
const interpolationPattern = /\$\{([A-Z][A-Z0-9_]*)(:-([^}]*))?\}/g;

function isPlainRecord(value: unknown): value is ConfigRecord {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function setSourceForValue(value: unknown, source: string, path: readonly string[], sources: Map<string, string>) {
	sources.set(path.join("."), source);

	if (isPlainRecord(value)) {
		for (const [key, nestedValue] of Object.entries(value)) {
			setSourceForValue(nestedValue, source, [...path, key], sources);
		}
	}
}

function mergeConfig(
	base: ConfigRecord,
	override: ConfigRecord,
	source: string,
	sources: Map<string, string>,
	path: readonly string[] = [],
): ConfigRecord {
	const result = { ...base };

	for (const [key, overrideValue] of Object.entries(override)) {
		const valuePath = [...path, key];
		const baseValue = result[key];

		if (isPlainRecord(baseValue) && isPlainRecord(overrideValue)) {
			result[key] = mergeConfig(baseValue, overrideValue, source, sources, valuePath);
			continue;
		}

		result[key] = overrideValue;
		setSourceForValue(overrideValue, source, valuePath, sources);
	}

	return result;
}

function interpolate(
	value: unknown,
	environment: Record<string, string | undefined>,
	sources: Map<string, string>,
	path: readonly string[] = [],
): unknown {
	if (typeof value === "string") {
		const source = sources.get(path.join(".")) ?? "unknown";

		return value.replace(interpolationPattern, (_match, name: string, defaultSyntax?: string, fallback?: string) => {
			const resolved = environment[name];
			if (resolved !== undefined && resolved !== "") {
				return resolved;
			}

			if (defaultSyntax !== undefined) {
				return fallback ?? "";
			}

			throw new Error(`Missing configuration environment variable "${name}" in module "${source}"`);
		});
	}

	if (isPlainRecord(value)) {
		return Object.fromEntries(
			Object.entries(value).map(([key, nestedValue]) => [key, interpolate(nestedValue, environment, sources, [...path, key])]),
		);
	}

	if (Array.isArray(value)) {
		return value.map((item, index) => interpolate(item, environment, sources, [...path, String(index)]));
	}

	return value;
}

export function loadConfig({
	configDirectory = join(import.meta.dir, "../../../config"),
	modules,
	environment,
}: LoadConfigOptions): Record<string, unknown> {
	const selectedModules = new Set<string>();
	const sources = new Map<string, string>();
	let config: ConfigRecord = {};

	for (const module of modules) {
		if (!moduleNamePattern.test(module)) {
			throw new Error(`Invalid configuration module name "${module}"`);
		}

		if (selectedModules.has(module)) {
			throw new Error(`Configuration module "${module}" was selected more than once`);
		}
		selectedModules.add(module);

		const filePath = join(configDirectory, `${module}.yaml`);
		if (!existsSync(filePath)) {
			throw new Error(`Configuration module "${module}" was not found`);
		}

		const parsed = parse(readFileSync(filePath, "utf8"));
		if (!isPlainRecord(parsed)) {
			throw new Error(`Configuration module "${module}" must contain a YAML object`);
		}

		config = mergeConfig(config, parsed, module, sources);
	}

	return interpolate(config, environment, sources) as ConfigRecord;
}
