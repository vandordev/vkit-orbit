import { expect, test } from "bun:test";

import { createAuthRoutes } from "../files/apps/api/src/routes/auth";

test("returns 401 for invalid sessions and sets secure login cookies only on HTTPS", async () => {
  const app = createAuthRoutes({
    currentUser: async () => null,
    login: async () => ({ token: "raw", user: { id: "u1", email: "a@example.com", isActive: true } }),
    logout: async () => true,
  });
  const invalid = await app.handle(new Request("http://localhost/api/auth/me"));
  expect(invalid.status).toBe(401);
  const login = await app.handle(new Request("https://localhost/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "a@example.com", password: "pw" }) }));
  expect(login.headers.get("set-cookie")).toContain("HttpOnly; Path=/; SameSite=Lax; Secure");
});
