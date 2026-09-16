export class UnauthorizedError extends Error {
	readonly code = "UNAUTHORIZED";
}
export class ForbiddenError extends Error {
	readonly code = "FORBIDDEN";
}
export class NotFoundError extends Error {
	readonly code = "NOT_FOUND";
}
