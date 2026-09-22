import { useQuery, type QueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, redirect, type LoaderFunctionArgs } from "react-router";
import {
  LayoutDashboard,
  Building2,
  Users,
  History,
  Server,
  ArrowLeft,
} from "lucide-react";
import { userQuery, type iUser } from "./dashboardlayout";
import { cn } from "@/lib/utils";

// Deliberately its own layout, not a reskin of the customer admin Sidebar —
// see the design brief's "do not reuse the customer admin sidebar visually
// without modification" and "must visually and conceptually remain separate
// from normal tenant/company roles."
export const platformLoader = (queryClient: QueryClient) => async (_args: LoaderFunctionArgs) => {
  try {
    const { user } = await queryClient.ensureQueryData(userQuery);
    // Server-side re-verifies this on every /platform/* request regardless
    // (see requirePlatformRole on the backend) — this check is only about
    // not rendering the console for someone who plainly shouldn't see it.
    if (user.platformRole !== "super_admin") {
      return redirect("/");
    }
    return null;
  } catch {
    return redirect("/auth");
  }
};

const NAV_ITEMS = [
  { to: "/platform", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/platform/companies", label: "Companies", icon: Building2 },
  { to: "/platform/users", label: "Users", icon: Users },
  { to: "/platform/audit", label: "Audit Logs", icon: History },
  { to: "/platform/system", label: "System", icon: Server },
];

export default function PlatformLayout() {
  const { data } = useQuery(userQuery);
  const user = data?.user as iUser | undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
      <aside className="hidden w-[240px] shrink-0 flex-col bg-[#0F172A] text-slate-300 md:flex">
        <div className="px-5 py-5">
          <p className="text-sm font-semibold text-white">INPRN</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Platform</span>
            <span className="rounded border border-slate-600 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
              Production
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to app
          </NavLink>
          <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {user?.fullname?.slice(0, 2).toUpperCase() ?? "PA"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-200">{user?.fullname}</p>
              <p className="text-[10px] font-medium text-blue-400">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-6">
          <p className="text-sm text-muted-foreground">Platform</p>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
