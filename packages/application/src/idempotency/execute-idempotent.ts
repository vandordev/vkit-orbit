import { createHash } from "node:crypto";
import { prisma } from "@repo/database";

function sortValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortValue);
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, item]) => [key, sortValue(item)]),
		);
	return value;
}
export function canonicalRequestHash(request: unknown): string {
	return createHash("sha256")
		.update(JSON.stringify(sortValue(request)))
		.digest("hex");
}
export class IdempotencyConflictError extends Error {
	readonly code = "IDEMPOTENCY_CONFLICT";
}

export async function executeIdempotent<T>(
	scope: { workspaceId: string; principalId: string },
	operation: string,
	key: string,
	request: unknown,
	action: (db: any) => Promise<T>,
	db: any = prisma,
): Promise<T> {
	const requestHash = canonicalRequestHash(request);
	const existing = await db.idempotencyRecord.findUnique({
		where: { workspaceId_operation_key: { workspaceId: scope.workspaceId, operation, key } },
	});
	if (existing) {
		if (existing.requestHash !== requestHash) throw new IdempotencyConflictError("idempotency key was reused with a different request");
		return existing.response as T;
	}
	return db.$transaction(async (tx: any) => {
		const raced = await tx.idempotencyRecord.findUnique({
			where: { workspaceId_operation_key: { workspaceId: scope.workspaceId, operation, key } },
		});
		if (raced) {
			if (raced.requestHash !== requestHash) throw new IdempotencyConflictError("idempotency key was reused with a different request");
			return raced.response as T;
		}
		const result = await action(tx);
		await tx.idempotencyRecord.create({
			data: {
				id: crypto.randomUUID(),
				workspaceId: scope.workspaceId,
				principalId: scope.principalId,
				operation,
				key,
				requestHash,
				response: result as never,
			},
		});
		return result;
	});
}
