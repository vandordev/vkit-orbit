import { createHash, randomBytes } from "node:crypto";
import { getPrisma, type DatabaseClient } from "@repo/db";
import { UnauthorizedError } from "../shared/errors";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const token = (prefix: string) => `${prefix}${randomBytes(32).toString("base64url")}`;

export async function createSession(input: { userId: string; expiresAt?: Date; userAgent?: string; ipAddress?: string }) {
	const secret = token("ses_");
	const session = await getPrisma().session.create({
		data: {
			id: token("sesid_"),
			userId: input.userId,
			tokenHash: digest(secret),
			expiresAt: input.expiresAt ?? new Date(Date.now() + 30 * 86400000),
			userAgent: input.userAgent,
			ipAddress: input.ipAddress,
		},
	});
	return { ...session, token: secret };
}
export async function authenticateSession(secret: string, db: Pick<DatabaseClient, "session"> = getPrisma()) {
	if (!secret.startsWith("ses_")) throw new UnauthorizedError("invalid session");
	const session = await db.session.findUnique({
		where: { tokenHash: digest(secret) },
		include: { user: { select: { id: true, email: true } } },
	});
	if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new UnauthorizedError("invalid session");
	return { userId: session.userId, sessionId: session.id, user: { id: session.user.id, email: session.user.email } };
}
export async function revokeSession(secret: string) {
	await getPrisma().session.updateMany({ where: { tokenHash: digest(secret), revokedAt: null }, data: { revokedAt: new Date() } });
}
