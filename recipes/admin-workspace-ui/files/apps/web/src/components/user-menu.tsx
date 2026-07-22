export type AdminCurrentUser = { name?: string; email: string };

export function UserMenu({ currentUser, onLogout }: { currentUser: AdminCurrentUser | null | undefined; onLogout: () => void }) {
  if (currentUser === undefined) return <div aria-label="Loading current user" className="h-9 w-32 animate-pulse rounded-full bg-slate-200" />;
  if (currentUser === null) return <span className="text-sm text-slate-500">Signed out</span>;
  return <div className="flex items-center gap-3">
    <div className="hidden text-right sm:block"><div className="text-sm font-semibold text-slate-950">{currentUser.name ?? currentUser.email}</div><div className="text-xs text-slate-500">{currentUser.email}</div></div>
    <button type="button" aria-label="Log out" onClick={onLogout} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-950 hover:text-slate-950">Log out</button>
  </div>;
}
