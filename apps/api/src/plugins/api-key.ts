import { Elysia } from "elysia";
import { authenticateApiKey } from "@repo/application";
import { AppError } from "../lib/errors";

export const apiKeyPlugin = new Elysia({ name: "api-key" }).derive(async ({ request, set }) => {
	const value = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	if (!value) {
		set.status = 401;
		return { principal: null };
	}
	try {
		return { principal: await authenticateApiKey(value) };
	} catch {
		set.status = 401;
		return { principal: null };
	}
});

export async function authenticatedPrincipal(request: Request) {
	const value = request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	if (!value) return null;
	try {
		return await authenticateApiKey(value);
	} catch {
		return null;
	}
}

export function requireApiScope(principal: { scopes: string[]; workspaceId: string; userId: string } | null, scope: string) {
	if (!principal) throw new AppError("UNAUTHORIZED", "API key authentication required", 401);
	if (!principal.scopes.includes(scope) && !principal.scopes.includes("*") && !principal.scopes.includes("admin"))
		throw new AppError("FORBIDDEN", `API key lacks ${scope}`, 403);
}
