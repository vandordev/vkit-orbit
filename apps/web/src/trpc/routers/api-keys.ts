import { router, permissionProcedure } from "../init";
export const apiKeysRouter = router({
	list: permissionProcedure("keys:write").query(({ ctx }) =>
		ctx.database.apiKey.findMany({
			where: { workspaceId: ctx.workspace.id },
			take: 100,
			orderBy: { createdAt: "desc" },
			select: { id: true, name: true, scopes: true, createdAt: true, expiresAt: true, revokedAt: true, lastUsedAt: true },
		}),
	),
});
