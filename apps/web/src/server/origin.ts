export function isSameOrigin(request: Request, expectedOrigin = new URL(request.url).origin) {
	const origin = request.headers.get("origin");
	return !origin || origin === expectedOrigin;
}

export function assertSameOrigin(request: Request, expectedOrigin?: string) {
	if (!isSameOrigin(request, expectedOrigin)) throw new Error("ORIGIN_MISMATCH");
}
