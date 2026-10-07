import { authenticateSession } from "@repo/application";
import { prisma } from "@repo/database";
import { readSessionCookie } from "../server/cookies";

export async function createTRPCContext(input: { req: Request }) {
	const secret = readSessionCookie(input.req);
	let session: Awaited<ReturnType<typeof authenticateSession>> | null = null;
	if (secret) {
		try {
			session = await authenticateSession(secret);
		} catch {
			session = null;
		}
	}
	return { req: input.req, session, database: prisma, responseHeaders: new Headers() };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
