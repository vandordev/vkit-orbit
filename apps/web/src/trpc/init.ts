import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const authenticatedProcedure = publicProcedure.use(({ ctx, next }) => {
	if (!ctx.session) throw new TRPCError({ code: "UNAUTHORIZED" });
	return next({ ctx: { ...ctx, session: ctx.session } });
});
export const workspaceProcedure = authenticatedProcedure.input((value: unknown) => value as { workspaceId: string });
export const permissionProcedure = workspaceProcedure;
