export type OperationDocumentation = {
	summary: string;
	description: string;
	tags: readonly string[];
	hide?: boolean;
};

/**
 * Creates the OpenAPI metadata required for every Elysia route handler.
 *
 * Operation IDs are intentionally omitted: `@elysiajs/openapi` generates a
 * stable ID from the HTTP method and route path.
 */
export function apiOperation(input: OperationDocumentation) {
	const summary = input.summary.trim();
	const description = input.description.trim();
	const tags = input.tags.map((tag) => tag.trim());

	if (!summary || !description || tags.length === 0 || tags.some((tag) => !tag)) {
		throw new Error("API operation documentation requires a non-empty summary, description, and tag.");
	}

	return {
		summary,
		description,
		tags,
		...(input.hide ? { hide: true } : {}),
	};
}
