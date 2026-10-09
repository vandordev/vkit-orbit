import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { discoverStories } from "../.storybook/discovery";

describe("repository story discovery", () => {
	test("finds colocated stories across workspaces and excludes generated/dependency files", () => {
		const root = mkdtempSync(join(tmpdir(), "orbit-story-discovery-"));
		const configDirectory = join(root, "apps/storybook/.storybook");
		const included = [
			"apps/web/src/app/-components/page.stories.tsx",
			"packages/ui/button.stories.tsx",
			"apps/storybook/examples/example.stories.tsx",
		];
		const excluded = [
			"node_modules/demo/demo.stories.tsx",
			".git/demo.stories.tsx",
			"apps/web/dist/demo.stories.tsx",
			"apps/web/.output/demo.stories.tsx",
			"apps/storybook/storybook-static/demo.stories.tsx",
			"apps/web/src/button.test.tsx",
		];
		try {
			for (const path of [...included, ...excluded]) {
				const file = join(root, path);
				mkdirSync(dirname(file), { recursive: true });
				writeFileSync(file, "export default {};");
			}
			const stories = discoverStories(root, configDirectory);
			expect(stories.map((path) => resolve(configDirectory, path)).sort()).toEqual(included.map((path) => join(root, path)).sort());
			expect(stories).toEqual([...stories].sort());
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	});
});
