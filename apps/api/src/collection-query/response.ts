import { t, type TSchema } from "elysia";

import type { CursorPosition } from "./cursor";
import type { CollectionDefinition } from "./definition";
import type { ResponseDocumentation } from "../schemas/envelope";

export type CollectionPage<T> = {
	items: T[];
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	startPosition?: CursorPosition;
	endPosition?: CursorPosition;
};

export function collectionEnvelope<T extends TSchema>(item: T, documentation: ResponseDocumentation) {
	return t.Object(
		{
			success: t.Literal(true, {
				description: "Whether the request completed successfully.",
				examples: [true],
			}),
			data: t.Array(item),
			meta: t.Object({
				requestId: t.String({
					description: "Identifier used to correlate this request with server logs.",
					examples: ["req_01JQZ3HAP4D77YQ58D7T"],
				}),
				page: t.Object({
					size: t.Integer({
						minimum: 1,
						description: "Number of items requested for this page.",
						examples: [25],
					}),
					hasNextPage: t.Boolean({
						description: "Whether a subsequent page is available.",
						examples: [true],
					}),
					hasPreviousPage: t.Boolean({
						description: "Whether a preceding page is available.",
						examples: [false],
					}),
					startCursor: t.Union([t.String(), t.Null()], {
						description: "Cursor representing the first item in this page, or null when empty.",
						examples: ["eyJ2IjoxfQ", null],
					}),
					endCursor: t.Union([t.String(), t.Null()], {
						description: "Cursor representing the last item in this page, or null when empty.",
						examples: ["eyJ2IjoxfQ", null],
					}),
				}),
			}),
			links: t.Object({
				self: t.String({
					description: "Canonical relative URL for this page.",
					examples: ["/api/v1/orders?page[size]=25"],
				}),
				next: t.Union([t.String(), t.Null()], {
					description: "Relative URL for the next page, or null when there is no next page.",
					examples: ["/api/v1/orders?page[after]=eyJ2IjoxfQ", null],
				}),
				prev: t.Union([t.String(), t.Null()], {
					description: "Relative URL for the previous page, or null when there is no previous page.",
					examples: ["/api/v1/orders?page[before]=eyJ2IjoxfQ", null],
				}),
			}),
		},
		{
			description: documentation.description,
			examples: [documentation.example],
		},
	);
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
