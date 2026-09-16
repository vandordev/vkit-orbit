import { claimOutboxBatch, markOutboxFailed, markOutboxPublished } from "@repo/application";
import { createJobId, jobContracts, type QueueName } from "@repo/queue";
export async function runOutboxRelay(input: {
	queue: { add: (name: string, data: unknown, options: { jobId: string }) => Promise<unknown> };
	db?: any;
	limit?: number;
	afterAdd?: () => Promise<void>;
}) {
	const rows = await claimOutboxBatch(input.limit ?? 100, input.db);
	for (const row of rows) {
		try {
			const contract = jobContracts[row.contract as keyof typeof jobContracts];
			if (!contract) throw new Error(`unknown contract: ${row.contract}`);
			await input.queue.add(contract.name, row.payload, { jobId: createJobId(contract, row.businessId, row.revision) });
			if (input.afterAdd) await input.afterAdd();
			await markOutboxPublished(row.id, input.db);
		} catch {
			await markOutboxFailed(row.id, input.db);
		}
	}
	return rows.length;
}
