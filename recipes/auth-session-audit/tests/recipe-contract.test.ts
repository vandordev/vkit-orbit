import { expect, test } from "bun:test";

const root = new URL("..", import.meta.url);

test("documents the opt-in auth installation order", async () => {
  const readme = await Bun.file(new URL("README.md", root)).text();
  for (const step of ["schema migration", "application exports", "API route registration", "server config", "optional web shell"]) {
    expect(readme).toContain(step);
  }
});

test("defines neutral auth models", async () => {
  const schema = await Bun.file(new URL("files/packages/database/prisma/schema.prisma.fragment", root)).text();
  expect(schema).toContain("model User");
  expect(schema).toContain("model AuthSession");
  expect(schema).toContain("model AuditLog");
  expect(schema).toContain("tokenHash");
  expect(schema).toContain("isActive");
});
