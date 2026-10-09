import { getPrisma } from "@repo/db";
export function revokeApiKey(id: string) {
	return getPrisma().apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}
