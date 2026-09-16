import { authenticateSession } from "@repo/application";
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
	return { req: input.req, session, responseHeaders: new Headers() };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
