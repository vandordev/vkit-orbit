import { getPrisma } from "@repo/db";
export const markOutboxPublished = (id: string, db: any = getPrisma()) =>
	db.queueOutbox.update({ where: { id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
export const markOutboxFailed = (id: string, db: any = getPrisma()) =>
	db.queueOutbox.update({ where: { id }, data: { status: "FAILED", claimedAt: null, availableAt: new Date() } });
