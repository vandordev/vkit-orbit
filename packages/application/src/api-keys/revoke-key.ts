import { prisma } from "@repo/db";
export function revokeApiKey(id: string) {
	return prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}
