import { expect, test } from "bun:test";

import { workerNotificationApiKey } from "./runtime";

test("exposes the API runtime worker key singleton", () => {
	expect(typeof workerNotificationApiKey).toBe("string");
});
