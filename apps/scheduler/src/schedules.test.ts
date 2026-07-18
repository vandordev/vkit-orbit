import { expect, test } from "bun:test";

import { registerSchedules } from "./schedules";

test("registers no product schedules in the generic baseline", () => {
	let inserted = false;
	const stop = registerSchedules({ insert: async () => { inserted = true; } });
	stop();
	expect(inserted).toBe(false);
});
