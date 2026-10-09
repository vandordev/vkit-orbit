import { getWebConfig } from "@repo/config/server";
import { getPrisma } from "@repo/db";
import { signRealtimeTicket } from "@repo/realtime";

export async function createRealtimeTicket(userId: string) {
	const membership = await getPrisma().workspaceMember.findFirst({ where: { userId }, select: { workspaceId: true } });
	if (!membership) throw new Error("workspace membership required");
	const config = getWebConfig();
	return {
		ticket: signRealtimeTicket(
			{ subjectId: userId, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() },
			config.realtime.ticketSecret,
		),
		workspaceId: membership.workspaceId,
	};
}
