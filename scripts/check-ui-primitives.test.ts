import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkUiPrimitives, inspectUiSource } from "./check-ui-primitives";

describe("shared UI primitive policy tooling", () => {
	for (const tag of [
		"button",
		"input",
		"select",
		"option",
		"optgroup",
		"textarea",
		"label",
		"dialog",
		"details",
		"summary",
		"progress",
		"meter",
		"table",
		"caption",
		"thead",
		"tbody",
		"tfoot",
		"tr",
		"th",
		"td",
	]) {
		test(`rejects native ${tag}`, () =>
			expect(inspectUiSource(`const view = <${tag} />;`, "legacy.stories.tsx")[0]).toContain("legacy.stories.tsx:1:"));
	}
	for (const source of [
		'const Control = "button"; const view = <Control />;',
		"const view = <motion.button />;",
		'createElement("input", {});',
		'const Tag = "input"; React.createElement(Tag);',
		'jsx("select", {}); jsxs("table", {});',
		'motion.create("button");',
		'import { Button } from "@/components/ui/button";',
		'export { Input } from "./input";',
		'import { Input } from "../../ui/input";',
		'import { Button } from "@base-ui/react/button";',
		'import * as Dialog from "@radix-ui/react-dialog";',
		'import { Slot } from "radix-ui/slot";',
	])
		test(`rejects common bypass: ${source}`, () => expect(inspectUiSource(source).length).toBeGreaterThan(0));
	test("allows shared primitives, structural markup, router links and SVG", () => {
		expect(
			inspectUiSource(
				'import { Button } from "@repo/components/button"; import { Input } from "@repo/components/input"; const view = <form><h1>Title</h1><labelled-section /><Input /><Button /><Link to="/" /><a href="/">Home</a><svg><path /></svg></form>;',
			),
		).toEqual([]);
	});
	test("scans all apps and stories, excluding tests, packages and generated outputs", () => {
		const root = mkdtempSync("/tmp/opencode/ui-primitives-");
		for (const directory of [
			"apps/web/src",
			"apps/storybook",
			"apps/web/dist",
			"apps/web/.output",
			"apps/web/node_modules",
			"packages/components",
		])
			mkdirSync(join(root, directory), { recursive: true });
		for (const path of [
			"apps/web/src/legacy.tsx",
			"apps/storybook/fixture.stories.tsx",
			"apps/web/src/native.test.tsx",
			"apps/web/src/native.spec.ts",
			"apps/web/dist/generated.js",
			"apps/web/.output/generated.js",
			"apps/web/node_modules/vendor.tsx",
			"packages/components/input.tsx",
		])
			writeFileSync(join(root, path), "const view = <input />;");
		expect(checkUiPrimitives(root)).toHaveLength(2);
	});
});
