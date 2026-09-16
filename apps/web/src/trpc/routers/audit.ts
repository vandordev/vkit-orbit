import { z } from "zod";
import { listAuditLogs } from "@repo/query";
import { router, workspaceProcedure } from "../init";
export const auditRouter = router({
	list: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), size: z.number().int().min(1).max(100).default(25) }))
		.query(({ input, ctx }) => listAuditLogs({ workspaceId: input.workspaceId, principalId: ctx.session.userId }, input)),
});
