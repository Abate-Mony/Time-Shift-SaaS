import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Zap, Database } from "lucide-react";
import { platformSystemQuery } from "@/utils/platform-api";

export const platformSystemLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformSystemQuery);
  return null;
};

// Visual layout ported directly from the Figma source's SystemScreen card
// treatment. Content is NOT copied 1:1 though: Figma's mock shows 6
// services with uptime/latency/incident history. Only API and Database are
// actually checked by this backend — adding plausible-looking numbers for
// Email Provider/Background Jobs/Storage/Realtime (nobody is monitoring
// them) would mean this console claims something is healthy when nobody
// checked. That's a different class of problem than mock subscription
// data: it's a false operational claim, not just an unfinished screen.
const SYS_STATUS: Record<string, { label: string; dot: string; text: string }> = {
  operational: { label: "Operational", dot: "bg-emerald-500", text: "text-emerald-700" },
  degraded: { label: "Degraded", dot: "bg-amber-500", text: "text-amber-700" },
  down: { label: "Down", dot: "bg-red-500", text: "text-red-700" },
  unknown: { label: "Unknown", dot: "bg-slate-400", text: "text-slate-500" },
};

const SERVICES = [
  { key: "api" as const, label: "API", icon: Zap },
  { key: "database" as const, label: "Database", icon: Database },
];

export function PlatformSystem() {
  const { data: system } = useQuery(platformSystemQuery);
  if (!system) return null;

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">System</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Platform infrastructure and service health. Only API and Database are actually monitored today.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SERVICES.map(({ key, label, icon: Icon }) => {
          const status = system[key].status;
          const sc = SYS_STATUS[status] ?? SYS_STATUS.unknown;
          return (
            <div key={key} className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <Icon size={15} className="text-slate-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    <span className={`text-xs font-semibold ${sc.text}`}>{sc.label}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
