import { prisma } from "@repo/database";
export function writeAuditLog(
	input: { workspaceId: string; principalId: string; action: string; resourceType: string; resourceId?: string; metadata?: unknown },
	db = prisma,
) {
	return db.auditLog.create({ data: { id: crypto.randomUUID(), ...input, metadata: input.metadata as never } });
}
