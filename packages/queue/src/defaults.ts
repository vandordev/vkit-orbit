export const queueDefaults = {
	removeOnComplete: { age: 7 * 24 * 60 * 60, count: 10_000 },
	removeOnFail: { age: 30 * 24 * 60 * 60, count: 50_000 },
	attempts: 5,
	backoff: { type: "exponential" as const, delay: 1_000 },
};

export function retryDelay(attempt: number, base = 1_000, cap = 60_000): number {
	if (!Number.isInteger(attempt) || attempt < 1) throw new Error("invalid retry attempt");
	return Math.min(cap, base * 2 ** (attempt - 1));
}
