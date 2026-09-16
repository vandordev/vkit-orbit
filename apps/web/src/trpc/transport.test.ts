import { expect, test } from "bun:test";

import { createTRPCClient, trpcEndpoint } from "./client";

test("browser tRPC client uses only same-origin httpBatchLink", () => {
	createTRPCClient("https://example.test");
	expect(trpcEndpoint("https://example.test")).toBe("https://example.test/trpc");
});
