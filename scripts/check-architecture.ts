import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const prismaWritePattern = /\.(create|update|upsert|delete|deleteMany|updateMany)\s*\(/;

function sourceFiles(root: string, directory: string): string[] {
	const absoluteDirectory = join(root, directory);
	try {
		return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
			const path = join(absoluteDirectory, entry.name);
			if (entry.isDirectory()) return sourceFiles(root, relative(root, path));
			return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".test.tsx") ? [path] : [];
		});
	} catch {
		return [];
	}
}

export function checkArchitecture(root = process.cwd()): string[] {
	const violations: string[] = [];
	const files = [join(root, "apps/api/src/app.ts"), ...sourceFiles(root, "apps/api/src/routes"), ...sourceFiles(root, "apps/web/src")];

	for (const file of files) {
		const content = readFileSync(file, "utf8");
		const label = relative(root, file).replaceAll("\\", "/");
		if (label === "apps/api/src/app.ts" && content.includes("@repo/application")) {
			violations.push(`${label}: API composition root must not import @repo/application`);
		}
		if (/^apps\/api\/src\/routes\/v\d+\//.test(label)) {
			if (content.includes("@repo/database")) violations.push(`${label}: versioned routes must not import @repo/database`);
			if (prismaWritePattern.test(content)) violations.push(`${label}: versioned routes must not perform Prisma writes`);
		}
		if (label.startsWith("apps/api/src/routes/") && /\.(get|post|put|patch|delete)\s*\(/.test(content)) {
			if (!content.includes("apiOperation") || !content.includes("apiOperation(")) {
				violations.push(`${label}: Elysia handlers must use apiOperation`);
			}
		}
		if (label.startsWith("apps/web/src/")) {
			if (content.includes("@repo/database")) violations.push(`${label}: web must not import @repo/database`);
			if (content.includes("@repo/application")) violations.push(`${label}: web must not import @repo/application`);
		}
	}

	return violations.sort();
}

if (import.meta.main) {
	const violations = checkArchitecture();
	if (violations.length > 0) {
		console.error(violations.join("\n"));
		process.exitCode = 1;
	} else {
		console.log("Architecture boundaries passed.");
	}
}
