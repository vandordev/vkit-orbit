import { router, authenticatedProcedure, publicProcedure } from "../init";

export const authRouter = router({
	me: authenticatedProcedure.query(({ ctx }) => ({ user: ctx.session.user, sessionId: ctx.session.sessionId })),
	status: publicProcedure.query(({ ctx }) => ({ authenticated: Boolean(ctx.session) })),
});
