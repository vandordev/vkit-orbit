import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import { checkArchitecture } from "./check-architecture";

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "vkit-architecture-"));
	await mkdir(join(root, "apps/api/src/routes/v1"), { recursive: true });
	await mkdir(join(root, "apps/web/src"), { recursive: true });
	return root;
}

test("rejects database and application imports across transport boundaries", async () => {
	const root = await fixture();
	await writeFile(join(root, "apps/api/src/routes/v1/users.ts"), 'import { prisma } from "@repo/database"; prisma.user.create();');
	await writeFile(join(root, "apps/api/src/app.ts"), 'import { command } from "@repo/application";');
	await writeFile(join(root, "apps/web/src/page.tsx"), 'import { prisma } from "@repo/database";');

	expect(checkArchitecture(root)).toEqual([
		"apps/api/src/app.ts: API composition root must not import @repo/application",
		"apps/api/src/routes/v1/users.ts: versioned routes must not import @repo/database",
		"apps/api/src/routes/v1/users.ts: versioned routes must not perform Prisma writes",
		"apps/web/src/page.tsx: web must not import @repo/database",
	]);
});

test("accepts a transport-only API composition", async () => {
	const root = await fixture();
	await writeFile(join(root, "apps/api/src/app.ts"), 'import { createV1Routes } from "./routes/v1";');
	await writeFile(join(root, "apps/api/src/routes/v1/status.ts"), "export const status = () => ({ success: true });");
	await writeFile(join(root, "apps/web/src/page.tsx"), 'export const page = "ok";');

	expect(checkArchitecture(root)).toEqual([]);
});
