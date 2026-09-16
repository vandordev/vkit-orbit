import { prisma } from "@repo/database";
export function revokeApiKey(id: string) {
	return prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}
