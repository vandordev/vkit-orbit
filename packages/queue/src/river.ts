import { PrismaDriver } from "@riverqueue/driver-prisma";
import { Client, JobArgsObject, type InsertOpts } from "riverqueue";
import { z } from "zod";

export type JobContract<T extends z.ZodTypeAny> = { kind: string; schema: T };

export type RiverInsertClient<TTx = unknown> = {
	insert(args: JobArgsObject, options?: InsertOpts & { tx?: TTx }): Promise<unknown>;
};

export function defineJob<T extends z.ZodTypeAny>(kind: string, schema: T): JobContract<T> {
	if (!kind.trim()) throw new Error("Job kind must not be blank");
	return { kind, schema };
}

export async function enqueue<T extends z.ZodTypeAny>(client: RiverInsertClient, contract: JobContract<T>, payload: z.input<T>, options?: InsertOpts) {
	const parsed = contract.schema.parse(payload);
	return client.insert(new JobArgsObject(contract.kind, parsed), options);
}

export async function enqueueInTransaction<TTx, T extends z.ZodTypeAny>(tx: TTx, client: RiverInsertClient<TTx>, contract: JobContract<T>, payload: z.input<T>, options?: InsertOpts) {
	const parsed = contract.schema.parse(payload);
	return client.insert(new JobArgsObject(contract.kind, parsed), { ...options, tx });
}

export function createRiverClient(prisma: ConstructorParameters<typeof PrismaDriver>[0]) {
	return new Client(new PrismaDriver(prisma));
}
