import { expect, test } from "bun:test";

import { createAuthService } from "../files/packages/application/src/auth/service";
import { redactAuditValue } from "../files/packages/application/src/auth/audit";
import { hashSessionToken } from "../files/packages/application/src/auth/sessions";

test("supports normalized login, renewal, logout, and inactive-user rejection", async () => {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const db: any = {
    $transaction: async (fn: (tx: any) => Promise<unknown>) => fn(db),
    user: {
      findUnique: async ({ where }: any) => where.email ? users.get(where.email) ?? null : [...users.values()].find((user) => user.id === where.id) ?? null,
      create: async ({ data }: any) => { const user = { id: "u1", ...data }; users.set(user.email, user); return user; },
    },
    authSession: {
      create: async ({ data }: any) => { const session = { id: "s1", ...data }; sessions.set(data.tokenHash, session); return session; },
      findUnique: async ({ where }: any) => sessions.get(where.tokenHash) ?? null,
      update: async ({ where, data }: any) => { const session = [...sessions.values()].find((item) => item.id === where.id); Object.assign(session, data); return session; },
    },
  };
  const service = createAuthService({ db, sessionTtlSeconds: 3600, now: () => new Date("2026-01-01T00:00:00Z"), tokenFactory: () => "raw-token" });
  await service.bootstrapAdmin(" ADMIN@Example.COM ", "correct horse battery staple");
  const login = await service.login("admin@example.com", "correct horse battery staple");
  expect(login.user).not.toHaveProperty("passwordHash");
  expect(await service.currentUser(login.token)).toMatchObject({ id: "u1", email: "admin@example.com" });
  expect(await service.logout(login.token)).toBe(true);
  expect(await service.currentUser(login.token)).toBeNull();
  users.get("admin@example.com").isActive = false;
  const second = await service.login("admin@example.com", "correct horse battery staple");
  expect(second).toBeNull();
});

test("hashes session tokens and recursively redacts sensitive audit keys", async () => {
  expect(await hashSessionToken("raw-token")).not.toBe("raw-token");
  const value = redactAuditValue({ password: "x", nested: [{ authorization: "y", okay: "z" }], safe: true });
  expect(value).toEqual({ nested: [{ okay: "z" }], safe: true });
});
