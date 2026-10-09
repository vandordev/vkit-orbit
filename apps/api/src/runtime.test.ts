import { expect, test } from "bun:test";

import { getWorkerNotificationApiKey } from "./runtime";

test("exposes the API runtime worker key singleton", () => {
	expect(typeof getWorkerNotificationApiKey).toBe("function");
});
