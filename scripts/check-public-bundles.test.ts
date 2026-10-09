import { expect, test } from "bun:test";
import { mkdtemp, writeFile } from "node:fs/promises";
import * as scanner from "./check-public-bundles";

test("public bundle checks fail closed and reject credential or server module markers", async () => {
	const root = await mkdtemp("/tmp/opencode/orbit-bundle-");
	expect(scanner.checkPublicBundles([root])).toHaveLength(1);
	await writeFile(`${root}/app.js`, 'const app = "synthetic-browser-app";');
	expect(scanner.checkPublicBundles([root])).toEqual([]);
	await writeFile(`${root}/app.js`, 'const DATABASE_URL = "postgresql://synthetic";');
	expect(scanner.checkPublicBundles([root])).toHaveLength(1);
	await writeFile(`${root}/app.js`, 'import { db } from "@repo/db";');
	expect(scanner.checkPublicBundles([root])).toHaveLength(1);
});
