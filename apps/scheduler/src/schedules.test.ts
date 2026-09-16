import { expect, test } from "bun:test";
import { installSchedulers, schedulerIds } from "./schedules";
test("installs stable scheduler identities", async () => {
	const ids: string[] = [];
	await installSchedulers({
		upsertJobScheduler: async (id) => {
			ids.push(id);
		},
	});
	expect(ids).toEqual(Object.values(schedulerIds));
});
