import { z } from "zod";
import { prisma } from "@repo/database";
import { createSession, createWorkspace, hashPassword, verifyPassword } from "@repo/application";
import { router, authenticatedProcedure, publicProcedure } from "../init";
import { sessionCookie } from "../../server/cookies";

export const authRouter = router({
	me: authenticatedProcedure.query(({ ctx }) => ({ user: ctx.session.user, sessionId: ctx.session.sessionId })),
	status: publicProcedure.query(({ ctx }) => ({ authenticated: Boolean(ctx.session) })),
	register: publicProcedure
		.input(z.object({ email: z.string().email(), password: z.string().min(12), name: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			const user = await prisma.user.create({
				data: { id: `usr_${crypto.randomUUID()}`, email: input.email, passwordHash: await hashPassword(input.password) },
			});
			const workspace = await createWorkspace({
				name: `${input.name}'s workspace`,
				slug: `ws-${crypto.randomUUID().slice(0, 8)}`,
				ownerId: user.id,
			});
			const session = await createSession({ userId: user.id, userAgent: ctx.req.headers.get("user-agent") ?? undefined });
			ctx.responseHeaders.set("set-cookie", sessionCookie(session.token));
			return { workspaceId: workspace.id };
		}),
	signIn: publicProcedure.input(z.object({ email: z.string().email(), password: z.string() })).mutation(async ({ input, ctx }) => {
		const user = await prisma.user.findUnique({ where: { email: input.email } });
		if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new Error("invalid credentials");
		const session = await createSession({ userId: user.id, userAgent: ctx.req.headers.get("user-agent") ?? undefined });
		const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
		if (!membership) throw new Error("workspace not found");
		ctx.responseHeaders.set("set-cookie", sessionCookie(session.token));
		return { workspaceId: membership.workspaceId };
	}),
});
