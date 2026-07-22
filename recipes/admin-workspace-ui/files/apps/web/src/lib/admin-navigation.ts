import type { ReactNode } from "react";

export type AdminNavigationItem = {
  label: string;
  to: string;
  icon?: ReactNode;
  visible?: boolean | (() => boolean);
};

export function filterAdminNavigation(items: readonly AdminNavigationItem[]): AdminNavigationItem[] {
  return items.filter((item) => typeof item.visible === "function" ? item.visible() : item.visible !== false);
}
