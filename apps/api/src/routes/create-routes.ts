import { Elysia } from "elysia";

import { collectionQueryPlugin } from "../collection-query/plugin";

export function createRoutes(version: number) {
	if (!Number.isSafeInteger(version) || version < 1) {
		throw new Error("API version must be a positive integer");
	}

	return new Elysia({ name: `api-v${version}`, prefix: `/api/v${version}` }).use(collectionQueryPlugin);
}
