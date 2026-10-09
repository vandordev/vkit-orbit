import { randomBytes } from "node:crypto";
import { getPrisma } from "@repo/db";
export async function createWorkspace(input: { name: string; slug: string; ownerId: string }) {
	return getPrisma().$transaction(async (tx) => {
		const workspace = await tx.workspace.create({
			data: { id: `ws_${randomBytes(12).toString("hex")}`, name: input.name, slug: input.slug },
		});
		await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: input.ownerId, role: "OWNER" } });
		return workspace;
	});
}
