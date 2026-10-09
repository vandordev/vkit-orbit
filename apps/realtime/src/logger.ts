import { safeLogContext } from "@repo/application/observability";

export function log(level: string, context: Record<string, unknown>, message: string): void {
	console[level === "error" ? "error" : "info"](JSON.stringify({ level, message, ...safeLogContext(context) }));
}
