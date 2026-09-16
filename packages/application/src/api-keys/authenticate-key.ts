import { createHash } from "node:crypto";
import { prisma } from "@repo/database";
import { UnauthorizedError } from "../shared/errors";
export async function authenticateApiKey(secret: string) {
	const key = await prisma.apiKey.findUnique({ where: { secretHash: createHash("sha256").update(secret).digest("hex") } });
	if (!key || key.revokedAt || (key.expiresAt && key.expiresAt <= new Date())) throw new UnauthorizedError("invalid API key");
	await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
	return { ...key, scopes: Array.isArray(key.scopes) ? (key.scopes as string[]) : [] };
}
