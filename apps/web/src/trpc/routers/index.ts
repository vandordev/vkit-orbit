import { router } from "../init";
import { authRouter } from "./auth";
import { workspaceRouter } from "./workspace";
import { documentsRouter } from "./documents";
import { processingRunsRouter } from "./processing-runs";
import { apiKeysRouter } from "./api-keys";
import { webhooksRouter } from "./webhooks";
import { auditRouter } from "./audit";

export const appRouter = router({
	auth: authRouter,
	workspace: workspaceRouter,
	documents: documentsRouter,
	processingRuns: processingRunsRouter,
	apiKeys: apiKeysRouter,
	webhooks: webhooksRouter,
	audit: auditRouter,
});
export type AppRouter = typeof appRouter;
