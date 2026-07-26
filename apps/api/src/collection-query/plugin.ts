import { Elysia } from "elysia";

import type { CollectionDefinition } from "./definition";

export const collectionQueryPlugin = new Elysia({ name: "collection-query" })
	.macro("collection", (definition: CollectionDefinition<any, any>) => ({
		query: definition.querySchema,
		resolve({ query, status }) {
			try {
				return { collection: definition.parse(query as Record<string, unknown>) };
			} catch {
				return status(422, { success: false, error: "VALIDATION_ERROR", message: "Validation failed" });
			}
		},
	}))
	.as("global");
