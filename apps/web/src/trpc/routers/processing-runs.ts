import { z } from "zod";
import { getProcessingRun } from "@repo/query";
import { router, workspaceProcedure } from "../init";

export const processingRunsRouter = router({
	detail: workspaceProcedure
		.input(z.object({ workspaceId: z.string(), runId: z.string() }))
		.query(({ input, ctx }) => getProcessingRun({ workspaceId: input.workspaceId, principalId: ctx.session.userId }, input.runId)),
});
