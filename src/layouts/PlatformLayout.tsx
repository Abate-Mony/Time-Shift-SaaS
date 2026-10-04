import { useQuery, type QueryClient } from "@tanstack/react-query";
import { NavLink, Outlet, redirect, useLocation, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Timer,
  Activity,
  Mail,
  ShieldCheck,
  Server,
  ArrowLeft,
  LogOut,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import { userQuery, type iUser } from "./dashboardlayout";

// Direct port of the Figma source's PlatformSidebar + PlatformTopBar
// (PlatformDashboard.tsx) — same literal markup/classes, swapped from its
// internal onNavigate(screen) state switch to real routes.
export const platformLoader = (queryClient: QueryClient) => async (_args: LoaderFunctionArgs) => {
  try {
    const { user } = await queryClient.ensureQueryData(userQuery);
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
  { to: "/platform/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/platform/trials", label: "Trials", icon: Timer },
  { to: "/platform/usage", label: "Usage", icon: Activity },
  { to: "/platform/emails", label: "Email Operations", icon: Mail },
  { to: "/platform/audit", label: "Audit Logs", icon: ShieldCheck },
  { to: "/platform/system", label: "System", icon: Server },
];

export default function PlatformLayout() {
  const { data } = useQuery(userQuery);
  const user = data?.user as iUser | undefined;
  const location = useLocation();

  const activeNav = [...NAV_ITEMS]
    .filter((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const initials = user?.fullname?.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "PA";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-[240px] shrink-0 bg-[#0F172A] flex-col">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-[#1E3A5F] rounded flex items-center justify-center">
              <span className="text-[10px] font-black text-white tracking-tight">OC</span>
            </div>
            <span className="text-sm font-bold text-white">OnClockly</span>
            <span className="ml-auto text-[9px] font-bold text-[#0F172A] bg-amber-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Platform
            </span>
          </div>
          <p className="text-[10px] text-slate-500 pl-8">Internal operations console</p>
        </div>

        {/* Env badge */}
        <div className="mx-4 mb-3">
          <div className="flex items-center gap-2 bg-[#162032] border border-[#1E3A5F]/40 rounded-lg px-3 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300">Production</span>
          </div>
        </div>

        <div className="px-3 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Navigation</div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                  isActive ? "bg-white/10 text-white font-semibold" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={14} className={isActive ? "text-white" : "text-slate-500"} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[#1E2D45] p-3 flex flex-col gap-1">
          <NavLink to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors w-full">
            <ArrowLeft size={13} className="text-slate-500" />
            Back to app
          </NavLink>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullname ?? "Platform Admin"}</p>
              <p className="text-[10px] text-amber-400 font-semibold">Super Admin</p>
            </div>
            <button className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-slate-300 transition-colors">
              <LogOut size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-12 border-b border-[#E2E8F0] bg-white flex items-center px-5 gap-4 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-sm text-slate-400">Platform</span>
            {activeNav && !activeNav.end && (
              <span className="flex items-center gap-1.5">
                <ChevronRight size={12} className="text-slate-300 shrink-0" />
                <span className="text-sm font-semibold text-slate-800">{activeNav.label}</span>
              </span>
            )}
          </div>
          <button
            onClick={() => toast("Command palette is a design preview — not wired up yet.")}
            className="flex items-center gap-2 h-8 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-xs text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <Search size={11} />
            Search
            <kbd className="ml-1 text-[10px] font-mono bg-slate-200 text-slate-500 px-1 rounded">⌘K</kbd>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 transition-colors relative">
            <Bell size={14} />
          </button>
        </div>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
