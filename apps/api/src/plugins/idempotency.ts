import { Elysia } from "elysia";

export const idempotencyPlugin = new Elysia({ name: "idempotency" }).derive(({ request, set }) => {
	const key = request.headers.get("idempotency-key");
	if (!key || key.length < 8 || key.length > 255) set.status = 422;
	return { idempotencyKey: key };
});
