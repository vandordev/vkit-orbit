import { router, permissionProcedure } from "../init";
export const webhooksRouter = router({
	list: permissionProcedure("webhooks:manage").query(({ ctx }) =>
		ctx.database.webhookEndpoint.findMany({
			where: { workspaceId: ctx.workspace.id },
			take: 100,
			orderBy: { createdAt: "desc" },
			select: { id: true, url: true, events: true, active: true, createdAt: true, updatedAt: true },
		}),
	),
});
