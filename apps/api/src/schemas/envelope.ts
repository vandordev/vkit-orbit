import { t, type TSchema } from "elysia";

export type ResponseDocumentation = {
	description: string;
	example: Record<string, unknown>;
};

export function successEnvelope<T extends TSchema>(data: T, documentation: ResponseDocumentation) {
	return t.Object(
		{
			success: t.Literal(true, {
				description: "Whether the request completed successfully.",
				examples: [true],
			}),
			data,
		},
		{
			description: documentation.description,
			examples: [documentation.example],
		},
	);
}

export function failureEnvelope(documentation: ResponseDocumentation) {
	return t.Object(
		{
			success: t.Literal(false, {
				description: "Whether the request completed successfully.",
				examples: [false],
			}),
			error: t.String({
				description: "Machine-readable error code.",
				examples: ["VALIDATION_ERROR"],
			}),
			message: t.String({
				description: "Human-readable explanation of the error.",
				examples: ["Validation failed"],
			}),
			details: t.Optional(
				t.Record(t.String(), t.Unknown(), {
					description: "Additional error details keyed by field or context.",
					examples: [{ email: "Must be a valid email address." }],
				}),
			),
			requestId: t.Optional(
				t.String({
					description: "Identifier used to correlate this request with server logs.",
					examples: ["req_01JQZ3HAP4D77YQ58D7T"],
				}),
			),
		},
		{
			description: documentation.description,
			examples: [documentation.example],
		},
	);
}
