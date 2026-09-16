import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@repo/database";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export async function createApiKey(input: { workspaceId: string; userId: string; name: string; scopes: string[]; expiresAt?: Date }) {
	const secret = `dph_${randomBytes(32).toString("base64url")}`;
	const key = await prisma.apiKey.create({
		data: {
			id: `key_${randomBytes(12).toString("hex")}`,
			workspaceId: input.workspaceId,
			userId: input.userId,
			name: input.name,
			scopes: input.scopes,
			secretHash: digest(secret),
			expiresAt: input.expiresAt,
		},
	});
	return { ...key, secret };
}
