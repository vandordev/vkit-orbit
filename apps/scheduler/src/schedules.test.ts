import { expect, test } from "bun:test";
import { jobContracts } from "@repo/queue";
import { installSchedulers } from "./schedules";

test("periodic schedules enqueue scan contracts without fake business identities", async () => {
	const seen: string[] = [];
	await installSchedulers({
		upsertJobScheduler: async (_id, _opts, template) => {
			const contract = jobContracts[template.name as keyof typeof jobContracts];
			expect(contract.schema.safeParse(template.data).success).toBe(true);
			expect(template.data).not.toHaveProperty("workspaceId", "system");
			seen.push(template.name);
		},
	});
	expect(seen).toEqual(["maintenance.processing.v1", "maintenance.webhooks.v1", "maintenance.uploads.v1"]);
});
