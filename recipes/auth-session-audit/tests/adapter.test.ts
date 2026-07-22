import { expect, test } from "bun:test";

import { parseSessionCookie, serializeSessionCookie, resolveAuthenticatedActor } from "../files/apps/api/src/lib/auth";

test("parses only a well-formed session cookie", () => {
  expect(parseSessionCookie("session=raw-token; other=value")).toBe("raw-token");
  expect(parseSessionCookie("session=%E0%A4%A")).toBeNull();
  expect(parseSessionCookie("other=value")).toBeNull();
});

test("serializes safe HTTP and HTTPS cookie attributes", () => {
  expect(serializeSessionCookie("raw token", false)).toBe("session=raw%20token; HttpOnly; Path=/; SameSite=Lax");
  expect(serializeSessionCookie("raw-token", true)).toContain("Secure");
});

test("resolves invalid sessions as unauthenticated", async () => {
  const service = { currentUser: async () => null };
  expect(await resolveAuthenticatedActor(new Request("http://localhost", { headers: { cookie: "session=bad" } }), service)).toBeNull();
});
