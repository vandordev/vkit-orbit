import { prisma } from "@repo/database";
export function outboxId(contract: string, businessId: string, revision: number): string {
	return `${contract}:${businessId}:${revision}`;
}
export async function enqueueIntent(
	input: { workspaceId: string; contract: string; businessId: string; revision: number; payload: unknown },
	db: any = prisma,
) {
	const id = outboxId(input.contract, input.businessId, input.revision);
	const existing = await db.queueOutbox.findUnique({ where: { workspaceId_id: { workspaceId: input.workspaceId, id } } });
	if (existing) {
		if (JSON.stringify(existing.payload) !== JSON.stringify(input.payload)) throw new Error("outbox payload conflict");
		return existing;
	}
	return db.queueOutbox.create({ data: { id, ...input, payload: input.payload as never } });
}
