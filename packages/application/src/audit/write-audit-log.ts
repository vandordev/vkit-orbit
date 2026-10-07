import { prisma, type DatabaseConnection, type Prisma } from "@repo/database";
export function writeAuditLog(
	input: {
		workspaceId: string;
		principalId: string;
		action: string;
		resourceType: string;
		resourceId?: string;
		metadata?: Prisma.InputJsonValue;
	},
	db: DatabaseConnection = prisma,
) {
	return db.auditLog.create({ data: { id: crypto.randomUUID(), ...input } });
}
