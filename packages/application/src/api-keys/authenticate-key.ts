import { createHash } from "node:crypto";
import { prisma, type DatabaseClient } from "@repo/database";
import { UnauthorizedError } from "../shared/errors";
import { hasPermission, permissions, type Permission } from "../auth/permissions";
export async function authenticateApiKey(secret: string, db: DatabaseClient = prisma) {
	const key = await db.apiKey.findUnique({ where: { secretHash: createHash("sha256").update(secret).digest("hex") } });
	if (!key || key.revokedAt || (key.expiresAt && key.expiresAt <= new Date())) throw new UnauthorizedError("invalid API key");
	const member = await db.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId: key.workspaceId, userId: key.userId } },
		select: { role: true },
	});
	if (!member) throw new UnauthorizedError("invalid API key");
	await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
	const stored = Array.isArray(key.scopes) ? key.scopes.filter((scope): scope is string => typeof scope === "string") : [];
	const scopes =
		stored.includes("*") || stored.includes("admin")
			? [...permissions[member.role]]
			: stored.filter((scope) => hasPermission(member.role, scope as Permission));
	return { ...key, scopes };
}
