import { router, workspaceProcedure } from "../init";

export const workspaceRouter = router({
	current: workspaceProcedure.query(({ ctx }) =>
		ctx.database.workspace.findUniqueOrThrow({
			where: { id: ctx.workspace.id },
			select: { id: true, name: true, slug: true },
		}),
	),
});
