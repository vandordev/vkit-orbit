import { getPrisma } from "@repo/db";
export type WorkspaceMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export function changeWorkspaceMembership(input: { workspaceId: string; userId: string; role: WorkspaceMemberRole }) {
	return getPrisma().workspaceMember.upsert({
		where: { workspaceId_userId: { workspaceId: input.workspaceId, userId: input.userId } },
		create: input,
		update: { role: input.role },
	});
}
