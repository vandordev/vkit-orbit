import { Elysia, t } from "elysia";

import { isSecureRequest, parseSessionCookie, resolveAuthenticatedActor, serializeSessionCookie, type AuthService } from "../lib/auth";

type LoginService = AuthService & {
  login(email: string, password: string): Promise<{ token: string; user: unknown } | null>;
  logout(token: string): Promise<boolean>;
};

export function createAuthRoutes(service: LoginService) {
  return new Elysia({ prefix: "/api/auth", tags: ["Auth"] })
    .post("/login", async ({ body, request, set }) => {
      const result = await service.login(body.email, body.password);
      if (!result) {
        set.status = 401;
        return { success: false as const, error: "UNAUTHORIZED", message: "Invalid credentials" };
      }
      set.headers["set-cookie"] = serializeSessionCookie(result.token, isSecureRequest(request));
      return { success: true as const, data: { user: result.user } };
    }, { body: t.Object({ email: t.String({ minLength: 1 }), password: t.String({ minLength: 1 }) }) })
    .get("/me", async ({ request, set }) => {
      const user = await resolveAuthenticatedActor(request, service);
      if (!user) {
        set.status = 401;
        return { success: false as const, error: "UNAUTHORIZED", message: "Authentication required" };
      }
      return { success: true as const, data: { user } };
    })
    .post("/logout", async ({ request, set }) => {
      const token = parseSessionCookie(request.headers.get("cookie"));
      if (token) await service.logout(token);
      set.headers["set-cookie"] = serializeSessionCookie("", isSecureRequest(request), 0);
      set.status = 204;
      return;
    });
}
