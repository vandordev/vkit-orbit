import { prisma } from "@repo/database";
export async function claimOutboxBatch(limit = 100, db: any = prisma) {
	const rows = await db.queueOutbox.findMany({
		where: { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: new Date() } },
		orderBy: { createdAt: "asc" },
		take: limit,
	});
	const claimed = [];
	for (const row of rows) {
		const result = await db.queueOutbox.updateMany({
			where: { workspaceId: row.workspaceId, id: row.id, status: row.status },
			data: { status: "CLAIMED", claimedAt: new Date() },
		});
		if (result.count) claimed.push({ ...row, status: "CLAIMED" });
	}
	return claimed;
}
