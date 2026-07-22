import { useState, type ReactNode } from "react";

import { CommandMenu } from "./command-menu";
import { UserMenu, type AdminCurrentUser } from "./user-menu";
import { filterAdminNavigation, type AdminNavigationItem } from "../lib/admin-navigation";

export type AdminShellProps = {
  navigation: readonly AdminNavigationItem[];
  currentUser: AdminCurrentUser | null | undefined;
  onLogout: () => void;
  children: ReactNode;
  canView?: (item: AdminNavigationItem) => boolean;
};

export function AdminShell({ navigation, currentUser, onLogout, children, canView }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const items = filterAdminNavigation(navigation).filter((item) => canView?.(item) ?? true);
  return <div className="min-h-screen bg-[#f7f5f0] text-slate-950">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-200 md:flex md:flex-col ${collapsed ? "w-20" : "w-64"}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5"><span className={`text-xs font-black uppercase tracking-[0.28em] text-amber-700 ${collapsed ? "sr-only" : ""}`}>Workspace</span><button type="button" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={() => setCollapsed((value) => !value)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-slate-950">{collapsed ? "→" : "←"}</button></div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-1 p-3">{items.map((item) => <a key={item.to} href={item.to} title={collapsed ? item.label : undefined} aria-label={collapsed ? item.label : undefined} className="flex items-center rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-amber-50 hover:text-slate-950">{item.icon}<span className={collapsed ? "sr-only" : "ml-3"}>{item.label}</span></a>)}</nav>
    </aside>
    <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "md:pl-20" : "md:pl-64"}`}>
      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur md:px-8"><div><p className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">Operations</p><p className="mt-1 text-lg font-semibold tracking-tight">Good work happens in focus.</p></div><div className="flex items-center gap-4"><CommandMenu navigation={items} /><UserMenu currentUser={currentUser} onLogout={onLogout} /></div></header>
      <main className="mx-auto max-w-7xl p-5 md:p-8">{children}</main>
    </div>
  </div>;
}
