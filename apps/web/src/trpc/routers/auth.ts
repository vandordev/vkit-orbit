import { z } from "zod";
import { router, authenticatedProcedure, publicProcedure } from "../init";

export const authRouter = router({
	me: authenticatedProcedure.query(({ ctx }) => ({ user: ctx.session.user, sessionId: ctx.session.sessionId })),
	status: publicProcedure.query(({ ctx }) => ({ authenticated: Boolean(ctx.session) })),
	register: publicProcedure
		.input(z.object({ email: z.string().email(), password: z.string().min(12), name: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const result = await (await import("../../server/auth-commands")).register(input, ctx.req);
			ctx.responseHeaders.set(
				"set-cookie",
				`session=${encodeURIComponent(result.token)}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`,
			);
			return { workspaceId: result.workspaceId };
		}),
	signIn: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input, ctx }) => {
		const result = await (await import("../../server/auth-commands")).signIn(input, ctx.req);
		ctx.responseHeaders.set(
			"set-cookie",
			`session=${encodeURIComponent(result.token)}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Lax`,
		);
		return { workspaceId: result.workspaceId };
	}),
});
