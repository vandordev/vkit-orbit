import { router, workspaceProcedure } from "../init";

export const workspaceRouter = router({ current: workspaceProcedure.query(({ input }) => ({ workspaceId: input.workspaceId })) });
