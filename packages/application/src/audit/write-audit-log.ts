import { getPrisma, type DatabaseConnection, type Prisma } from "@repo/db";
export function writeAuditLog(
	input: {
		workspaceId: string;
		principalId: string;
		action: string;
		resourceType: string;
		resourceId?: string;
		metadata?: Prisma.InputJsonValue;
	},
	db: DatabaseConnection = getPrisma(),
) {
	return db.auditLog.create({ data: { id: crypto.randomUUID(), ...input } });
}
