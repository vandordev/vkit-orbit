import { existsSync, readdirSync, readFileSync } from "node:fs";
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
	const files = [
		join(root, "apps/api/src/app.ts"),
		...sourceFiles(root, "apps/api/src/routes"),
		...sourceFiles(root, "apps/web/src"),
		...sourceFiles(root, "packages"),
	];

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
			if (/fetch\s*\(\s*["'`]\/v1\//.test(content)) violations.push(`${label}: browser code must use same-origin tRPC, not /v1`);
			if (content.includes("@repo/config") || content.includes("process.env") || content.includes("@prisma/client")) {
				violations.push(`${label}: browser code must not import server-only modules`);
			}
		}
		if (!label.startsWith("packages/database/") && content.includes("@prisma/client")) {
			violations.push(`${label}: Prisma imports belong only to packages/database`);
		}
		if (label.startsWith("apps/api/src/routes/") && (content.match(/export\s+(?:async\s+)?function\s+\w+Handler/g) ?? []).length > 1) {
			violations.push(`${label}: Elysia operation files must export one handler`);
		}
	}

	for (const forbidden of ["go.mod", "go.sum"]) {
		if (existsSync(join(root, forbidden))) violations.push(`${forbidden}: Go runtime ownership is forbidden`);
	}
	for (const directory of ["apps/worker", "apps/migrate", "internal"]) {
		for (const file of sourceFilesByExtension(root, directory, [".go"])) {
			violations.push(`${relative(root, file).replaceAll("\\", "/")}: Go worker runtime files are forbidden`);
		}
	}

	return violations.sort();
}

function sourceFilesByExtension(root: string, directory: string, extensions: string[]): string[] {
	const absoluteDirectory = join(root, directory);
	try {
		return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
			const path = join(absoluteDirectory, entry.name);
			if (entry.isDirectory()) return sourceFilesByExtension(root, relative(root, path), extensions);
			return extensions.some((extension) => entry.name.endsWith(extension)) ? [path] : [];
		});
	} catch {
		return [];
	}
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
