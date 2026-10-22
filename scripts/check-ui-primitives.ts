import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import ts from "typescript";

const controls = new Set([
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
]);
const primitiveNames =
	"button|input|select|textarea|label|table|checkbox|switch|dialog|accordion|popover|tooltip|badge|dropdown|drawer|autocomplete|data-grid|calendar|date-picker|date-range-picker|input-password|input-search|input-phone|input-secret|input-otp|input-amount|input-group|empty|error-state|loading|toast|blobatar";
const primitiveBasename = new RegExp(`(?:^|/)(?:${primitiveNames})(?:\\.[cm]?[jt]sx?)?$`);
const rootDirectory = dirname(import.meta.dirname);

export function inspectUiSource(content: string, filename = "fixture.tsx"): string[] {
	const source = ts.createSourceFile(filename, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
	const violations: string[] = [];
	const aliases = new Map<string, string>();
	function report(node: ts.Node, message: string) {
		const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
		violations.push(`${filename}:${line + 1}: ${message}`);
	}
	function collect(node: ts.Node) {
		if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isStringLiteral(node.initializer)) {
			aliases.set(node.name.text, node.initializer.text);
		}
		ts.forEachChild(node, collect);
	}
	collect(source);
	function controlName(node: ts.Node): string {
		if (ts.isStringLiteral(node)) return node.text;
		if (ts.isIdentifier(node)) return aliases.get(node.text) ?? node.text;
		if (ts.isPropertyAccessExpression(node)) return node.name.text;
		if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) return node.argumentExpression.text;
		return "";
	}
	function visit(node: ts.Node) {
		if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
			const name = controlName(node.tagName);
			if (controls.has(name)) report(node, `Use a React primitive from @repo/components/* instead of <${name}>.`);
		}
		if (ts.isCallExpression(node)) {
			const name = controlName(node.expression);
			const first = node.arguments[0];
			if (["createElement", "jsx", "jsxs", "create"].includes(name) && first && controls.has(controlName(first))) {
				report(node, "Native controls and motion wrappers belong in packages/components.");
			}
		}
		if (
			(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
			node.moduleSpecifier &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const name = node.moduleSpecifier.text;
			const localPrimitive = (name.startsWith(".") || name.includes("/components/ui/")) && primitiveBasename.test(name);
			if (/^(?:@radix-ui\/|@base-ui\/|radix-ui(?:\/|$))/.test(name) || localPrimitive) {
				report(node, "UI primitives must be imported from @repo/components/*, not local or vendor implementations.");
			}
		}
		ts.forEachChild(node, visit);
	}
	visit(source);
	return violations;
}

export function checkUiPrimitives(root = rootDirectory): string[] {
	function scan(directory: string): string[] {
		return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
			if (["node_modules", "dist", "storybook-static", ".output", ".vite", ".turbo", ".git"].includes(entry.name)) return [];
			const path = join(directory, entry.name);
			if (entry.isDirectory()) return scan(path);
			if (!/\.[cm]?[jt]sx?$/.test(entry.name) || /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) return [];
			return inspectUiSource(readFileSync(path, "utf8"), relative(root, path));
		});
	}
	return scan(join(root, "apps"));
}

if (import.meta.main) {
	const violations = checkUiPrimitives();
	if (violations.length) {
		console.error(violations.join("\n"));
		process.exitCode = 1;
	} else console.log("UI primitive policy: no violations in apps (including legacy and stories).");
}
