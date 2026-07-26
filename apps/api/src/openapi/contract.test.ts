import { expect, test } from "bun:test";

import { validateOpenApiDocumentation } from "./contract";

test("reports missing parameter and response documentation", () => {
	const document = {
		paths: {
			"/widgets": {
				get: {
					operationId: "getWidgets",
					summary: "List widgets",
					description: "Returns widgets.",
					tags: ["Widgets"],
					parameters: [{ name: "limit", in: "query", schema: { type: "integer", examples: [10] } }],
					responses: { 200: { description: "Successful response.", content: { "application/json": { schema: {} } } } },
				},
			},
		},
	};

	expect(validateOpenApiDocumentation(document)).toEqual([
		"GET /widgets: parameter 'limit' requires a schema description",
		"GET /widgets: response 200 requires an application/json example",
	]);
});

test("accepts complete documented operations", () => {
	const document = {
		paths: {
			"/widgets/{widgetId}": {
				get: {
					operationId: "getWidgetByWidgetId",
					summary: "Get a widget",
					description: "Returns one widget by its identifier.",
					tags: ["Widgets"],
					parameters: [
						{
							name: "widgetId",
							in: "path",
							schema: { type: "string", description: "Widget identifier.", examples: ["wid_1"] },
						},
					],
					responses: {
						200: {
							description: "Successful widget response.",
							content: {
								"application/json": {
									schema: {
										description: "Widget response.",
										examples: [{ id: "wid_1" }],
										properties: {
											id: { type: "string", description: "Widget identifier.", examples: ["wid_1"] },
										},
									},
								},
							},
						},
					},
				},
			},
		},
	};

	expect(validateOpenApiDocumentation(document)).toEqual([]);
});
