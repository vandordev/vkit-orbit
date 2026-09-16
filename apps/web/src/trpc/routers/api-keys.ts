import { router, workspaceProcedure } from "../init";
export const apiKeysRouter = router({ list: workspaceProcedure.query(() => []) });
