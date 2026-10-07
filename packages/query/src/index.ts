export type PageInput = { size: number; after?: string; before?: string };
export type WorkspaceScope = { workspaceId: string; principalId: string };
import type { DatabaseClient } from "@repo/database";
import { ForbiddenError, hasPermission } from "@repo/application";

async function authorize(scope: WorkspaceScope, db: DatabaseClient, permission: "documents:read" | "audit:read") {
	const member = await db.workspaceMember.findUnique({
		where: { workspaceId_userId: { workspaceId: scope.workspaceId, userId: scope.principalId } },
		select: { role: true },
	});
	if (!member || !hasPermission(member.role, permission)) {
		throw new ForbiddenError("Workspace access denied");
	}
}

export function pageInput(input: PageInput): PageInput {
	if (!Number.isInteger(input.size) || input.size < 1 || input.size > 100) throw new Error("page size must be 1..100");
	if (input.after && input.before) throw new Error("after and before are mutually exclusive");
	return input;
}

export type DocumentDto = {
	id: string;
	workspaceId: string;
	title: string;
	contentType: string;
	byteSize: number;
	status: string;
	createdAt: string;
	updatedAt: string;
};
export async function getDocument(scope: WorkspaceScope, documentId: string, db?: DatabaseClient): Promise<DocumentDto | null> {
	const prisma = db ?? (await import("@repo/database")).prisma;
	await authorize(scope, prisma, "documents:read");
	const document = await prisma.document.findFirst({ where: { workspaceId: scope.workspaceId, id: documentId } });
	return document ? { ...document, createdAt: document.createdAt.toISOString(), updatedAt: document.updatedAt.toISOString() } : null;
}
export async function listDocuments(scope: WorkspaceScope, page: PageInput, db?: DatabaseClient) {
	pageInput(page);
	const prisma = db ?? (await import("@repo/database")).prisma;
	await authorize(scope, prisma, "documents:read");
	const rows = await prisma.document.findMany({
		where: { workspaceId: scope.workspaceId },
		orderBy: { id: "asc" },
		take: page.size + 1,
		...(page.after ? { cursor: { id: page.after }, skip: 1 } : {}),
	});
	return rows
		.slice(0, page.size)
		.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }));
}
export async function getProcessingRun(scope: WorkspaceScope, runId: string, db?: DatabaseClient) {
	const prisma = db ?? (await import("@repo/database")).prisma;
	await authorize(scope, prisma, "documents:read");
	const run = await prisma.processingRun.findFirst({ where: { workspaceId: scope.workspaceId, id: runId } });
	return run
		? {
				...run,
				result: run.result as unknown,
				createdAt: run.createdAt.toISOString(),
				updatedAt: run.updatedAt.toISOString(),
				leaseExpiresAt: run.leaseExpiresAt?.toISOString() ?? null,
			}
		: null;
}
export async function listAuditLogs(scope: WorkspaceScope, page: PageInput, db?: DatabaseClient) {
	pageInput(page);
	const prisma = db ?? (await import("@repo/database")).prisma;
	await authorize(scope, prisma, "audit:read");
	return prisma.auditLog
		.findMany({ where: { workspaceId: scope.workspaceId }, orderBy: { createdAt: "desc" }, take: page.size })
		.then((rows) => rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })));
}
