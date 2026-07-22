import type { SafeUser } from "../../../../packages/application/src/auth/policy";

const cookieName = "session";

export function parseSessionCookie(header: string | null | undefined, name = cookieName): string | null {
  if (!header) return null;
  const pair = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!pair) return null;
  const value = pair.slice(name.length + 1);
  if (!value) return null;
  try {
    return decodeURIComponent(value) || null;
  } catch {
    return null;
  }
}

export function serializeSessionCookie(token: string, secure: boolean, maxAge?: number, name = cookieName): string {
  return `${name}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${secure ? "; Secure" : ""}${maxAge === undefined ? "" : `; Max-Age=${maxAge}`}`;
}

export type AuthService = { currentUser(token: string): Promise<SafeUser | null> };

export async function resolveAuthenticatedActor(request: Request, service: AuthService): Promise<SafeUser | null> {
  const token = parseSessionCookie(request.headers.get("cookie"));
  return token ? service.currentUser(token) : null;
}

export function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}
