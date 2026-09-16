import { createRealtimeConfig } from "@repo/config";
import { prisma } from "@repo/database";
import { signRealtimeTicket } from "@repo/realtime";

export async function createRealtimeTicket(userId: string) {
	const membership = await prisma.workspaceMember.findFirst({ where: { userId }, select: { workspaceId: true } });
	if (!membership) throw new Error("workspace membership required");
	const config = createRealtimeConfig(process.env);
	return {
		ticket: signRealtimeTicket(
			{ subjectId: userId, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() },
			config.REALTIME_TICKET_SECRET,
		),
		workspaceId: membership.workspaceId,
	};
}
