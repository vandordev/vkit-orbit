import { router, workspaceProcedure } from "../init";
export const webhooksRouter = router({ list: workspaceProcedure.query(() => []) });
