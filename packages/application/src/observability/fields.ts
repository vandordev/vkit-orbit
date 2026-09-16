export const observabilityFields = [
	"service",
	"environment",
	"requestId",
	"correlationId",
	"workspaceId",
	"principalId",
	"documentId",
	"runId",
	"queue",
	"contract",
	"jobId",
	"attempt",
	"durationMs",
	"outcome",
	"errorCode",
] as const;

export type ObservabilityField = (typeof observabilityFields)[number];
export type SafeLogContext = Partial<Record<ObservabilityField, string | number>>;

export function safeLogContext(input: Record<string, unknown>): SafeLogContext {
	const result: SafeLogContext = {};
	for (const field of observabilityFields) {
		const value = input[field];
		if (typeof value === "string" || typeof value === "number") result[field] = value;
	}
	return result;
}
