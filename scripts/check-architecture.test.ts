import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

import { checkArchitecture } from "./check-architecture";

async function fixture() {
	const root = await mkdtemp(join(tmpdir(), "vkit-architecture-"));
	await mkdir(join(root, "apps/api/src/routes/v1"), { recursive: true });
	await mkdir(join(root, "apps/web/src"), { recursive: true });
	await writeFile(join(root, "apps/api/src/app.ts"), "export const app = {}; ");
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

test("requires operation documentation for every Elysia route source", async () => {
	const root = await fixture();
	const route = join(root, "apps/api/src/routes/v1/widgets.ts");
	await writeFile(route, 'new Elysia().get("/widgets", () => ({ success: true }));');

	expect(checkArchitecture(root)).toEqual(["apps/api/src/routes/v1/widgets.ts: Elysia handlers must use apiOperation"]);

	await writeFile(
		route,
		'import { apiOperation } from "../../openapi/operation"; new Elysia().get("/widgets", () => ({ success: true }), { detail: apiOperation({ summary: "List widgets", description: "Returns widgets.", tags: ["Widgets"] }) });',
	);

	expect(checkArchitecture(root)).toEqual([]);
});

test("rejects forbidden runtime and browser boundaries", async () => {
	const root = await fixture();
	await mkdir(join(root, "apps/worker"), { recursive: true });
	await writeFile(join(root, "apps/worker/main.go"), "package main");
	await writeFile(join(root, "apps/web/src/bad-client.ts"), 'fetch("/v1/status"); import "@repo/database";');

	expect(checkArchitecture(root)).toEqual([
		"apps/web/src/bad-client.ts: browser code must use same-origin tRPC, not /v1",
		"apps/web/src/bad-client.ts: web must not import @repo/database",
		"apps/worker/main.go: Go worker runtime files are forbidden",
	]);
});

test("checks current API handler paths, browser tRPC clients and scheduler ownership", async () => {
	const root = await fixture();
	await mkdir(join(root, "apps/api/src/handlers/v1/documents"), { recursive: true });
	await mkdir(join(root, "apps/web/src/trpc"), { recursive: true });
	await mkdir(join(root, "apps/scheduler/src"), { recursive: true });
	await writeFile(
		join(root, "apps/api/src/handlers/v1/documents/create.ts"),
		'import { prisma } from "@repo/database"; prisma.document.create();',
	);
	await writeFile(join(root, "apps/web/src/trpc/client.ts"), 'import { prisma } from "@repo/database"; import "@repo/storage";');
	await writeFile(join(root, "apps/scheduler/src/main.ts"), 'import { prisma } from "@repo/database";');
	expect(checkArchitecture(root)).toEqual([
		"apps/api/src/handlers/v1/documents/create.ts: versioned routes must not import @repo/database",
		"apps/api/src/handlers/v1/documents/create.ts: versioned routes must not perform Prisma writes",
		"apps/scheduler/src/main.ts: scheduler must be enqueue-only",
		"apps/web/src/trpc/client.ts: browser code must not import server-only modules",
		"apps/web/src/trpc/client.ts: web must not import @repo/database",
	]);
});
