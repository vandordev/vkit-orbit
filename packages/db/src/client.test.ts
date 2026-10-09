import { expect, test } from "bun:test";

import { createDatabaseClient } from "./client";

test("exports one Prisma client", () => {
	const prisma = createDatabaseClient({ url: "postgresql://localhost/fixture_test", environment: "test" });
	expect(prisma).toBeDefined();
	expect(typeof prisma.$connect).toBe("function");
});
