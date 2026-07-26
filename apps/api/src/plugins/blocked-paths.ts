import { Elysia } from "elysia";

const blockedPathPatterns: readonly RegExp[] = [
	/^\/\.env/,
	/^\/\.git/,
	/^\/\.vscode/,
	/^\/node_modules/,
	/^\/package\.json/,
	/^\/bun\.lockb$/,
	/^\/bun\.lock$/,
	/^\/pnpm-lock\.yaml$/,
	/^\/yarn\.lock$/,
	/\/\.env$/,
	/\/\.git\//,
];

export const blockedPathsPlugin = new Elysia({ name: "blocked-paths" })
	.onRequest(({ request, set }) => {
		const pathname = new URL(request.url).pathname.toLowerCase();
		if (blockedPathPatterns.some((pattern) => pattern.test(pathname))) {
			set.status = 404;
			return { success: false, error: "NOT_FOUND", message: "Resource not found" };
		}
	})
	.as("global");
