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

test("implements accessible collapsed, auth, authorization, and command behaviors", async () => {
  const shell = await Bun.file(new URL("files/apps/web/src/components/admin-shell.tsx", root)).text();
  const command = await Bun.file(new URL("files/apps/web/src/components/command-menu.tsx", root)).text();
  const user = await Bun.file(new URL("files/apps/web/src/components/user-menu.tsx", root)).text();
  expect(shell).toContain("aria-label={collapsed ? item.label : undefined}");
  expect(shell).toContain("canView");
  expect(command).toContain("metaKey || event.ctrlKey");
  expect(command).toContain("removeEventListener");
  expect(user).toContain("Loading current user");
  expect(user).toContain("onLogout");
});
