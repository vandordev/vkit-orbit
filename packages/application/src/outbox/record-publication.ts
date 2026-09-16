import { prisma } from "@repo/database";
export const markOutboxPublished = (id: string, db: any = prisma) =>
	db.queueOutbox.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
export const markOutboxFailed = (id: string, db: any = prisma) =>
	db.queueOutbox.update({ where: { id }, data: { status: "FAILED", claimedAt: null, availableAt: new Date() } });
