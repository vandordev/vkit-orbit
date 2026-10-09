import { createHash } from "node:crypto";
import { getPrisma, type DatabaseClient, type DatabaseTransaction, type Prisma } from "@repo/db";

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
	action: (db: DatabaseTransaction) => Promise<T>,
	db: DatabaseClient = getPrisma(),
): Promise<T> {
	const requestHash = canonicalRequestHash(request);
	if (!key || key.length > 255) throw new Error("invalid idempotency key");
	// Serialize the reservation BEFORE business writes. A transaction-scoped lock
	// is released on both commit and rollback, including process termination.
	const lock = createHash("sha256")
		.update(JSON.stringify([scope.workspaceId, operation, key]))
		.digest()
		.readBigInt64BE();
	return db.$transaction(async (tx) => {
		await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lock})::text`;
		const raced = await tx.idempotencyRecord.findUnique({
			where: { workspaceId_operation_key: { workspaceId: scope.workspaceId, operation, key } },
		});
		if (raced) {
			if (raced.requestHash !== requestHash || raced.principalId !== scope.principalId)
				throw new IdempotencyConflictError("idempotency key was reused by a different principal or request");
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
				response: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
			},
		});
		return result;
	});
}
