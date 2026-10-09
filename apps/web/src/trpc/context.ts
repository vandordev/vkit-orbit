import { authenticateSession } from "@repo/application";
import { getPrisma } from "@repo/db";
import { readSessionCookie } from "../server/cookies";

type Session = Awaited<ReturnType<typeof authenticateSession>>;
export function createTRPCContext(input: { req: Request }, dependencies = { authenticateSession, getDatabase: getPrisma }) {
	let sessionPromise: Promise<Session | null> | undefined;
	const getSession = () => sessionPromise ??= Promise.resolve().then(async () => {
		const secret = readSessionCookie(input.req);
		if (!secret) return null;
		try { return await dependencies.authenticateSession(secret); } catch { return null; }
	});
	return { req: input.req, getSession, getDatabase: dependencies.getDatabase, responseHeaders: new Headers() };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
