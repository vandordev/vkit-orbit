import { expect, test } from "bun:test";

const root = new URL("..", import.meta.url);

test("defines neutral navigation and shell contracts", async () => {
  const navigation = await Bun.file(new URL("files/apps/web/src/lib/admin-navigation.ts", root)).text();
  const shell = await Bun.file(new URL("files/apps/web/src/components/admin-shell.tsx", root)).text();
  expect(navigation).toContain("AdminNavigationItem");
  expect(navigation).toContain("visible?");
  expect(shell).toContain("AdminShellProps");
  expect(shell).toContain("onLogout");
  expect(shell).not.toMatch(/campaign|customer|Broadcaster/);
});

test("documents dependency tiers without baseline leakage", async () => {
  const readme = await Bun.file(new URL("README.md", root)).text();
  expect(readme).toContain("Animate UI");
  expect(readme).toContain("Niko Table");
  expect(readme).toContain("baseline");
});
