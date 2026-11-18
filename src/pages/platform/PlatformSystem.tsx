import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Zap, Database, Play, AlertOctagon } from "lucide-react";
import { ConfirmModal } from "@/components/platform/figma/primitives";
import {
  platformSystemQuery, platformCronQuery, runPlatformCronJob, type PlatformCronJob,
  platformMaintenanceQuery, enableMaintenanceMode, disableMaintenanceMode,
} from "@/utils/platform-api";

export const platformSystemLoader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(platformSystemQuery),
    queryClient.ensureQueryData(platformCronQuery),
    queryClient.ensureQueryData(platformMaintenanceQuery),
  ]);
  return null;
};

const CRON_STATUS: Record<PlatformCronJob["lastStatus"], { label: string; dot: string; text: string }> = {
  success: { label: "Success", dot: "bg-emerald-500", text: "text-emerald-700" },
  failed: { label: "Failed", dot: "bg-red-500", text: "text-red-700" },
  running: { label: "Running", dot: "bg-amber-500 animate-pulse", text: "text-amber-700" },
  never_run: { label: "Never run", dot: "bg-slate-300", text: "text-slate-400" },
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
  const { data: cronJobs } = useQuery(platformCronQuery);
  const { data: maintenance } = useQuery(platformMaintenanceQuery);
  const queryClient = useQueryClient();
  const [confirmJob, setConfirmJob] = useState<PlatformCronJob | null>(null);
  const [maintenanceDialog, setMaintenanceDialog] = useState<"enable" | "disable" | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const runMutation = useMutation({
    mutationFn: (name: string) => runPlatformCronJob(name),
    onSuccess: (data) => {
      toast[data.success ? "success" : "error"](data.msg);
      queryClient.invalidateQueries({ queryKey: ["platform", "cron"] });
      setConfirmJob(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.msg ?? "Failed to run job."),
  });

  const maintenanceMutation = useMutation({
    mutationFn: (reason: string) =>
      maintenanceDialog === "enable" ? enableMaintenanceMode(maintenanceMessage.trim() || undefined, reason) : disableMaintenanceMode(reason),
    onSuccess: (data) => {
      toast.success(data.msg);
      queryClient.invalidateQueries({ queryKey: ["platform", "system", "maintenance"] });
      setMaintenanceDialog(null);
      setMaintenanceMessage("");
    },
    onError: (err: any) => toast.error(err.response?.data?.msg ?? "Failed to update maintenance mode."),
  });

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

      <div className={`bg-white border rounded-lg p-4 flex items-start gap-4 ${maintenance?.enabled ? "border-red-300 bg-red-50/40" : "border-[#E2E8F0]"}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${maintenance?.enabled ? "bg-red-100" : "bg-slate-50 border border-[#E2E8F0]"}`}>
          <AlertOctagon size={15} className={maintenance?.enabled ? "text-red-600" : "text-slate-500"} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-800">Maintenance mode</p>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${maintenance?.enabled ? "bg-red-500" : "bg-emerald-500"}`} />
              <span className={`text-xs font-semibold ${maintenance?.enabled ? "text-red-700" : "text-emerald-700"}`}>
                {maintenance?.enabled ? "Enabled — app is blocked for tenants" : "Disabled — app is running normally"}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {maintenance?.enabled
              ? `${maintenance.message ?? "No message set."} ${maintenance.enabledAt ? `Enabled ${dayjs(maintenance.enabledAt).format("D MMM, HH:mm")}.` : ""}`
              : "Emergency kill switch — blocks every tenant-facing request platform-wide. Platform tools stay reachable."}
          </p>
          <button
            onClick={() => setMaintenanceDialog(maintenance?.enabled ? "disable" : "enable")}
            className={`mt-3 h-8 px-3 text-xs font-semibold rounded-md transition-colors ${
              maintenance?.enabled ? "text-slate-600 border border-[#E2E8F0] hover:bg-slate-50" : "text-white bg-red-600 hover:bg-red-700"
            }`}
          >
            {maintenance?.enabled ? "Disable maintenance mode" : "Enable maintenance mode"}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-800">Scheduled Jobs</h3>
          <p className="text-xs text-slate-400 mt-0.5">Every cron job registered in the app, with its real last-run status.</p>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              {["Job", "Schedule", "Last run", "Status", "Last error", ""].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cronJobs?.map((job) => {
              const sc = CRON_STATUS[job.lastStatus];
              return (
                <tr key={job.name} className="border-b border-[#F1F5F9] last:border-0">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800">{job.label}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{job.schedule}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {job.lastRunAt ? `${dayjs(job.lastRunAt).format("D MMM, HH:mm:ss")} (${job.lastTriggeredBy})` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                      <span className={`text-xs font-semibold ${sc.text}`}>{sc.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-600 max-w-[260px] truncate" title={job.lastError ?? undefined}>
                    {job.lastError ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setConfirmJob(job)}
                      className="h-7 px-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors"
                    >
                      <Play size={11} /> Run now
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {confirmJob && (
        <ConfirmModal
          title={`Run "${confirmJob.label}" now?`}
          body="This runs the job immediately, outside its normal schedule. Its outcome will be recorded here and in the audit log."
          confirmLabel="Run job"
          showReason={false}
          busy={runMutation.isPending}
          onConfirm={() => runMutation.mutate(confirmJob.name)}
          onClose={() => setConfirmJob(null)}
        />
      )}

      {maintenanceDialog === "enable" && (
        <ConfirmModal
          title="Enable maintenance mode?"
          body="This blocks every tenant-facing request platform-wide — every company, every user, immediately. Only platform admin tools stay reachable."
          consequence="Use this only for a real emergency (e.g. a bad deploy or a data-integrity incident). It takes effect on the next request to every server instance."
          confirmLabel="Enable maintenance mode"
          danger
          confirmText="MAINTENANCE"
          busy={maintenanceMutation.isPending}
          onConfirm={(reason) => maintenanceMutation.mutate(reason)}
          onClose={() => { setMaintenanceDialog(null); setMaintenanceMessage(""); }}
        >
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Message shown to users (optional)
            </label>
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              rows={2}
              placeholder="OnClockly is temporarily down for maintenance. Please try again shortly."
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50 resize-none"
            />
          </div>
        </ConfirmModal>
      )}

      {maintenanceDialog === "disable" && (
        <ConfirmModal
          title="Disable maintenance mode?"
          body="Every tenant immediately regains full access."
          confirmLabel="Disable maintenance mode"
          busy={maintenanceMutation.isPending}
          onConfirm={(reason) => maintenanceMutation.mutate(reason)}
          onClose={() => setMaintenanceDialog(null)}
        />
      )}
    </div>
  );
}
