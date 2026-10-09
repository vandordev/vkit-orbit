import { prisma } from "@repo/db";
import { createSession, createWorkspace, hashPassword, verifyPassword } from "@repo/application";
export async function register(input: any, request: Request) {
	const user = await prisma.user.create({
		data: { id: `usr_${crypto.randomUUID()}`, email: input.email, passwordHash: await hashPassword(input.password) },
	});
	const workspace = await createWorkspace({
		name: `${input.name}'s workspace`,
		slug: `ws-${crypto.randomUUID().slice(0, 8)}`,
		ownerId: user.id,
	});
	const session = await createSession({ userId: user.id, userAgent: request.headers.get("user-agent") ?? undefined });
	return { workspaceId: workspace.id, token: session.token };
}
export async function signIn(input: any, request: Request) {
	const user = await prisma.user.findUnique({ where: { email: input.email } });
	if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new Error("invalid credentials");
	const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
	if (!membership) throw new Error("workspace not found");
	const session = await createSession({ userId: user.id, userAgent: request.headers.get("user-agent") ?? undefined });
	return { workspaceId: membership.workspaceId, token: session.token };
}
