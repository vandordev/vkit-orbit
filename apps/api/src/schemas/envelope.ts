import { t, type TSchema } from "elysia";

export function successEnvelope<T extends TSchema>(data: T) {
	return t.Object({
		success: t.Literal(true),
		data,
	});
}

export function failureEnvelope() {
	return t.Object({
		success: t.Literal(false),
		error: t.String(),
		message: t.String(),
		details: t.Optional(t.Record(t.String(), t.Unknown())),
		requestId: t.Optional(t.String()),
	});
}
