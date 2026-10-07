export function log(level: string, context: Record<string, unknown>, message: string): void {
	const safe = Object.fromEntries(
		["service", "environment", "contract", "outcome", "errorCode"].flatMap((key) => {
			const value = context[key];
			return typeof value === "string" || typeof value === "number" ? [[key, value]] : [];
		}),
	);
	console[level === "error" ? "error" : "info"](JSON.stringify({ level, message, ...safe }));
}
