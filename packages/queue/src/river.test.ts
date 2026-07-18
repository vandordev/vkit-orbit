import { describe, expect, test } from "bun:test";
import { z } from "zod";

import { defineJob, enqueue, enqueueInTransaction } from "./river";

const contract = defineJob("example.v1", z.object({ resourceId: z.string().uuid() }));
const validPayload = { resourceId: "b7fa9ad5-9c93-4cce-a83d-8d0438abef12" };

describe("River TypeScript producer", () => {
	test("rejects invalid payload before it reaches River", async () => {
		let inserted = false;
		const client = { insert: async () => { inserted = true; } };
		await expect(enqueue(client, contract, { resourceId: "bad" })).rejects.toThrow();
		expect(inserted).toBe(false);
	});

	test("uses the stable kind and validated JSON payload", async () => {
		let inserted: unknown;
		const client = { insert: async (job: unknown) => { inserted = job; return { id: 42 }; } };
		await enqueue(client, contract, validPayload);
		const job = inserted as { kind: string; toJSON(): unknown };
		expect({ kind: job.kind, args: job.toJSON() }).toEqual({ kind: "example.v1", args: validPayload });
	});

	test("forwards the Prisma transaction to River insert", async () => {
		let options: unknown;
		const transaction = { id: "tx" };
		const client = { insert: async (_job: unknown, insertOptions: unknown) => { options = insertOptions; } };
		await enqueueInTransaction(transaction, client, contract, validPayload);
		expect(options).toMatchObject({ tx: transaction });
	});
});
