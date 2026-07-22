import { useEffect, useState, type ReactNode } from "react";

import { filterAdminNavigation, type AdminNavigationItem } from "../lib/admin-navigation";

export function CommandMenu({ navigation, onNavigate }: { navigation: readonly AdminNavigationItem[]; onNavigate?: (to: string) => void }): ReactNode {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const items = filterAdminNavigation(navigation);
  return <>
    <button type="button" aria-label="Open command menu" onClick={() => setOpen(true)} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-900 hover:text-slate-950">
      Search <kbd className="ml-2 rounded border border-slate-300 px-1.5 py-0.5">⌘K</kbd>
    </button>
    {open && <div role="dialog" aria-modal="true" aria-label="Command menu" className="fixed inset-0 z-50 bg-slate-950/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="mx-auto mt-[12vh] max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 px-5 py-4 text-sm font-semibold text-slate-950">Jump to</div>
        <div className="p-2">{items.map((item) => <a key={item.to} href={item.to} className="flex items-center rounded-xl px-4 py-3 text-sm text-slate-700 hover:bg-amber-50 hover:text-slate-950" onClick={() => { onNavigate?.(item.to); setOpen(false); }}>{item.icon}<span className="ml-3">{item.label}</span></a>)}</div>
      </div>
    </div>}
  </>;
}
