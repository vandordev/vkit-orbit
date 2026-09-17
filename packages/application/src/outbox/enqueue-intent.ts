import { prisma } from "@repo/database";
export function outboxId(contract: string, businessId: string, revision: number): string {
	return `${contract}:${businessId}:${revision}`;
}
function stableJson(value: unknown): string {
	if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
	if (value && typeof value === "object") {
		return `{${Object.entries(value as Record<string, unknown>)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
			.join(",")}}`;
	}
	return JSON.stringify(value);
}
export async function enqueueIntent(
	input: { workspaceId: string; contract: string; businessId: string; revision: number; payload: unknown; availableAt?: Date },
	db: any = prisma,
) {
	const id = outboxId(input.contract, input.businessId, input.revision);
	const existing = await db.queueOutbox.findUnique({ where: { workspaceId_id: { workspaceId: input.workspaceId, id } } });
	if (existing) {
		if (stableJson(existing.payload) !== stableJson(input.payload))
			throw new Error(`outbox payload conflict: existing=${JSON.stringify(existing.payload)} input=${JSON.stringify(input.payload)}`);
		return existing;
	}
	return db.queueOutbox.create({ data: { id, ...input, payload: input.payload as never } });
}
