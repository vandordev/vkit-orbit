export const sessionCookieName = "session";

export function sessionCookie(value: string, maxAge = 60 * 60 * 24 * 30) {
	return `${sessionCookieName}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
	return sessionCookie("", 0);
}

export function readSessionCookie(request: Request) {
	const value = request.headers.get("cookie")?.match(/(?:^|;\s*)session=([^;]*)/)?.[1];
	return value ? decodeURIComponent(value) : null;
}
