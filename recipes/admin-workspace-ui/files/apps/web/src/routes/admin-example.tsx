import { AdminShell } from "../components/admin-shell";

const navigation = [
  { label: "Overview", to: "/admin" },
  { label: "Activity", to: "/admin/activity" },
];

export function AdminExample() {
  return <AdminShell navigation={navigation} currentUser={{ email: "operator@example.com", name: "Operator" }} onLogout={() => {}}>
    <section className="rounded-3xl border border-slate-200 bg-white p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Static example</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">A calm place to operate.</h1><p className="mt-3 max-w-xl text-slate-600">Replace this content with consumer-owned views and data.</p></section>
  </AdminShell>;
}
