const sensitiveKey =
	/(authorization|cookie|password|secret|token|api[-_]?key|credential|signed[-_]?url|document[-_]?content|raw[-_]?content|database[-_]?url|redis[-_]?url|storage)/i;
const sensitiveValue =
	/(?:postgres(?:ql)?|redis|mysql):\/\/|(?:X-Amz-|Signature=|AWSAccessKeyId=)|bearer\s+|(?:api[_-]?key|webhook[_-]?secret|session)=/i;

export function redact(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(redact);
	if (value && typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) result[key] = sensitiveKey.test(key) ? "[REDACTED]" : redact(child);
		return result;
	}
	if (typeof value === "string" && sensitiveValue.test(value)) return "[REDACTED]";
	return value;
}

export function redactError(error: unknown): { code: string } {
	if (error instanceof Error) return { code: error.name || "ERROR" };
	return { code: "UNKNOWN_ERROR" };
}
