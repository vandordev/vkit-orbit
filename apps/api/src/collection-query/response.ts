import { t, type TSchema } from "elysia";

import type { CursorPosition } from "./cursor";
import type { CollectionDefinition } from "./definition";

export type CollectionPage<T> = {
	items: T[];
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startPosition?: CursorPosition;
	endPosition?: CursorPosition;
};

export function collectionEnvelope<T extends TSchema>(item: T) {
	return t.Object({
		success: t.Literal(true),
		data: t.Array(item),
		meta: t.Object({
			requestId: t.String(),
			page: t.Object({
				size: t.Integer({ minimum: 1 }),
				hasNextPage: t.Boolean(),
				hasPreviousPage: t.Boolean(),
				startCursor: t.Union([t.String(), t.Null()]),
				endCursor: t.Union([t.String(), t.Null()]),
			}),
		}),
		links: t.Object({
			self: t.String(),
			next: t.Union([t.String(), t.Null()]),
			prev: t.Union([t.String(), t.Null()]),
		}),
	});
}

export function createCollectionResponse<T, Definition extends CollectionDefinition<any, any>>(
	definition: Definition,
	page: CollectionPage<T>,
	requestUrl: string,
	requestId: string,
) {
	if (page.hasNextPage && !page.endPosition) throw new Error("A next page requires an end cursor position");
	if (page.hasPreviousPage && !page.startPosition) throw new Error("A previous page requires a start cursor position");

	const url = new URL(requestUrl);
	const collection = definition.parse(Object.fromEntries(url.searchParams));
	const startCursor = page.startPosition ? definition.createCursor(collection, page.startPosition) : null;
	const endCursor = page.endPosition ? definition.createCursor(collection, page.endPosition) : null;
	const self = toRelativeLink(url.pathname, definition.serialize(collection));
	const next = page.hasNextPage
		? toRelativeLink(
				url.pathname,
				definition.serialize({ ...collection, pagination: { ...collection.pagination, after: page.endPosition } }),
			)
		: null;
	const prev = page.hasPreviousPage
		? toRelativeLink(
				url.pathname,
				definition.serialize({ ...collection, pagination: { ...collection.pagination, before: page.startPosition } }),
			)
		: null;

	return {
		success: true as const,
		data: page.items,
		meta: {
			requestId,
			page: {
				size: collection.pagination.size,
				hasNextPage: page.hasNextPage,
				hasPreviousPage: page.hasPreviousPage,
				startCursor,
				endCursor,
			},
		},
		links: { self, next, prev },
	};
}

function toRelativeLink(pathname: string, parameters: URLSearchParams): string {
	const search = parameters.toString().replaceAll("%5B", "[").replaceAll("%5D", "]");
	return search ? `${pathname}?${search}` : pathname;
}
