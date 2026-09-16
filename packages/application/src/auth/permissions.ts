import { ForbiddenError } from "../shared/errors";

export const permissions = {
	OWNER: ["workspace:read", "workspace:write", "documents:read", "documents:write", "audit:read", "keys:write"],
	ADMIN: ["workspace:read", "workspace:write", "documents:read", "documents:write", "audit:read", "keys:write"],
	MEMBER: ["workspace:read", "documents:read", "documents:write"],
	VIEWER: ["workspace:read", "documents:read"],
} as const;
export type Permission = (typeof permissions)[keyof typeof permissions][number];
export function hasPermission(role: keyof typeof permissions, permission: string): boolean {
	return (permissions[role] as readonly string[]).includes(permission);
}
export function requirePermission(role: keyof typeof permissions, permission: string): void {
	if (!hasPermission(role, permission)) throw new ForbiddenError(`missing permission: ${permission}`);
}
