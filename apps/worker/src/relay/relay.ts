import { claimOutboxBatch, markOutboxFailed, markOutboxPublished } from "@repo/application";
import { createJobId, jobContracts, type QueueName } from "@repo/queue";
type RelayQueue = {
	add: (name: string, data: unknown, options: { jobId: string }) => Promise<unknown>;
	getJob?: (id: string) => Promise<{ getState(): Promise<string>; remove(): Promise<void> } | undefined>;
};
export async function runOutboxRelay(input: {
	queue: RelayQueue;
	queues?: Partial<Record<QueueName, RelayQueue>>;
	db?: any;
	limit?: number;
	afterAdd?: () => Promise<void>;
}) {
	const rows = await claimOutboxBatch(input.limit ?? 100, input.db);
	for (const row of rows) {
		try {
			const contract = jobContracts[row.contract as keyof typeof jobContracts];
			if (!contract) throw new Error(`unknown contract: ${row.contract}`);
			const queue = input.queues ? input.queues[contract.queue] : input.queue;
			if (!queue) throw new Error("outbox queue is not configured");
			const jobId = createJobId(contract, row.businessId, row.revision);
			const retained = await queue.getJob?.(jobId);
			if (retained && ["completed", "failed"].includes(await retained.getState())) await retained.remove();
			await queue.add(contract.name, contract.schema.parse(row.payload), { jobId });
			if (input.afterAdd) await input.afterAdd();
			await markOutboxPublished(row.id, input.db);
		} catch {
			await markOutboxFailed(row.id, input.db);
		}
	}
	return rows.length;
}
