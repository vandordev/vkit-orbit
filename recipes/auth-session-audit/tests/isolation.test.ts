import { expect, test } from "bun:test";

test("baseline does not import or expose auth recipe secrets", async () => {
  const routeSource = await Bun.file("apps/api/src/routes/index.ts").text();
  const viteTypes = await Bun.file("apps/web/vite.config.ts").text();
  expect(routeSource).not.toContain("auth-session-audit");
  expect(viteTypes).not.toMatch(/AUTH_(SESSION|BOOTSTRAP)/);
});

test("documents consumer-owned authorization hooks", async () => {
  const readme = await Bun.file(new URL("../README.md", import.meta.url)).text();
  expect(readme).toContain("consumer-owned predicate/policy interface");
  expect(readme).toContain("no default role or capability enums");
});
