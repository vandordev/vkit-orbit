import { Elysia } from "elysia";

import { env } from "../lib/env";
import { isDocumentationAuthorized } from "../lib/docs-auth";

export const documentationAuthPlugin = new Elysia({ name: "documentation-auth" })
	.onRequest(({ request, set }) => {
		const pathname = new URL(request.url).pathname;
		if (pathname !== "/api/docs" && pathname !== "/api/openapi.json") return;
		if (
			!isDocumentationAuthorized(
				request.headers.get("authorization") ?? undefined,
				env.OPENAPI_BASIC_AUTH_USERNAME,
				env.OPENAPI_BASIC_AUTH_PASSWORD,
			)
		) {
			set.status = 401;
			set.headers["www-authenticate"] = 'Basic realm="API documentation"';
			return { success: false, error: "UNAUTHORIZED", message: "Documentation authentication required" };
		}
	})
	.as("global");
