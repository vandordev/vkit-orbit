import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context";
import { z } from "zod";
import { hasPermission, type Permission } from "@repo/application";

const t = initTRPC.context<TRPCContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const authenticatedProcedure = publicProcedure.use(async ({ ctx, next }) => {
	const session = await ctx.getSession();
	if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });
	return next({ ctx: { ...ctx, session, database: ctx.getDatabase() } });
});
export const workspaceProcedure = authenticatedProcedure
	.input(z.object({ workspaceId: z.string().min(1) }))
	.use(async ({ ctx, input, next }) => {
		const member = await ctx.database.workspaceMember.findUnique({
			where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: ctx.session.userId } },
			select: { role: true },
		});
		if (!member) throw new TRPCError({ code: "FORBIDDEN" });
		return next({ ctx: { ...ctx, workspace: { id: input.workspaceId, role: member.role } } });
	});
export function permissionProcedure(permission: Permission) {
	return workspaceProcedure.use(({ ctx, next }) => {
		if (!hasPermission(ctx.workspace.role, permission)) throw new TRPCError({ code: "FORBIDDEN" });
		return next();
	});
}
