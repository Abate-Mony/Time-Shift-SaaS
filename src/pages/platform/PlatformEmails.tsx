import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Globe, RefreshCw, Trash2, X, Loader2 } from "lucide-react";
import { DomainBadge, TH, TD, THead, TBody, Row, RowMenu, ConfirmModal } from "@/components/platform/figma/primitives";
import {
  platformEmailDomainsQuery, platformEmailDomainRecordsQuery,
  retryEmailDomainVerification, resetEmailDomain,
} from "@/utils/platform-api";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";

export const platformEmailsLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformEmailDomainsQuery);
  return null;
};

// Slide-in panel for a single domain's live DNS records — same shell as
// PlatformAudit.tsx's AuditDetailDrawer. Fetched on demand (enabled only
// while open) since it's a live Resend API call, not a DB read.
function DnsRecordsDrawer({ companyId, companyName, onClose }: { companyId: string; companyName: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({ ...platformEmailDomainRecordsQuery(companyId), enabled: true });

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-[480px] bg-white border-l border-[#E2E8F0] shadow-2xl flex flex-col h-full overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-slate-400">DNS records</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{companyName}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
          {isError && <p className="text-sm text-red-600">Couldn't load DNS records from the provider right now.</p>}
          {data?.records.length === 0 && <p className="text-sm text-slate-400">No DNS records returned by the provider.</p>}
          {data?.records.map((r, i) => (
            <div key={i} className="border border-[#E2E8F0] rounded-lg p-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{r.type}{r.priority != null ? ` · priority ${r.priority}` : ""}</span>
                <DomainBadge status={r.status} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                <code className="text-xs font-mono text-slate-700 break-all">{r.name}</code>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Value</p>
                <code className="text-xs font-mono text-slate-700 break-all">{r.value}</code>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function PlatformEmails() {
  const { data } = useQuery(platformEmailDomainsQuery);
  const { canSupport } = usePlatformPermissions();
  const queryClient = useQueryClient();
  const [recordsFor, setRecordsFor] = useState<{ companyId: string; companyName: string } | null>(null);
  const [resetDialog, setResetDialog] = useState<{ companyId: string; companyName: string } | null>(null);

  const retryMutation = useMutation({
    mutationFn: (companyId: string) => retryEmailDomainVerification(companyId),
    onSuccess: () => {
      toast.success("Verification check re-run.");
      queryClient.invalidateQueries({ queryKey: ["platform", "email-domains"] });
    },
    onError: () => toast.error("Couldn't retry verification."),
  });

  const resetMutation = useMutation({
    mutationFn: (vars: { companyId: string; reason: string }) => resetEmailDomain(vars.companyId, vars.reason),
    onSuccess: () => {
      toast.success("Domain reset. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "email-domains"] });
      setResetDialog(null);
    },
    onError: () => toast.error("Couldn't reset this domain."),
  });

  const metrics: Array<{ label: string; value: string; danger?: boolean }> = data
    ? [
        { label: "Connected domains", value: String(data.data.length) },
        { label: "Verified", value: String(data.metrics.verified) },
        { label: "Pending", value: String(data.metrics.pending) },
        { label: "Failed", value: String(data.metrics.failed), danger: data.metrics.failed > 0 },
        { label: "Email failures today", value: String(data.metrics.failedToday), danger: data.metrics.failedToday > 0 },
      ]
    : [];

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Email Operations</h1>
        <p className="text-sm text-slate-500 mt-0.5">Custom sending domains across every company that's connected one.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className={`bg-white border rounded-lg p-4 ${m.danger ? "border-red-200 bg-red-50/40" : "border-[#E2E8F0]"}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${m.danger ? "text-red-700" : "text-slate-900"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-800">Custom Sending Domains</h3>
          <p className="text-xs text-slate-400 mt-0.5">Companies on the shared default sender don't appear here.</p>
        </div>
        <table className="w-full border-collapse">
          <THead>
            <TH>Company</TH>
            <TH>Domain</TH>
            <TH>Status</TH>
            <TH>Sender</TH>
            <TH>Verified at</TH>
            <TH>Last checked</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <tr><td colSpan={7} className="text-center text-sm text-slate-400 py-8">No companies have connected a custom sending domain yet.</td></tr>
            )}
            {data?.data.map((d) => (
              <Row key={d.companyId}>
                <TD className="font-semibold text-slate-800 text-sm">{d.companyName}</TD>
                <TD><code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{d.domain}</code></TD>
                <TD><DomainBadge status={d.status} /></TD>
                <TD className="text-xs text-slate-500">{d.sender}</TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{d.verifiedAt ? dayjs(d.verifiedAt).format("D MMM YYYY") : "—"}</TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{d.lastCheckedAt ? dayjs(d.lastCheckedAt).format("D MMM, HH:mm") : "—"}</TD>
                <TD>
                  <RowMenu
                    items={[
                      { label: "View DNS records", icon: Globe, onClick: () => setRecordsFor({ companyId: d.companyId, companyName: d.companyName }) },
                      ...(!canSupport ? [] : [
                        { label: "Retry verification", icon: RefreshCw, onClick: () => retryMutation.mutate(d.companyId) },
                        { label: "Reset domain", icon: Trash2, danger: true, onClick: () => setResetDialog({ companyId: d.companyId, companyName: d.companyName }) },
                      ]),
                    ]}
                  />
                </TD>
              </Row>
            ))}
          </TBody>
        </table>
      </div>

      <AnimatePresence>
        {recordsFor && (
          <DnsRecordsDrawer companyId={recordsFor.companyId} companyName={recordsFor.companyName} onClose={() => setRecordsFor(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resetDialog && (
          <ConfirmModal
            title={`Reset ${resetDialog.companyName}'s sending domain?`}
            body="This clears the custom-domain configuration. The company falls back to the shared default sender immediately."
            consequence="The company will need to reconnect and re-verify their domain from scratch if they want to use it again."
            confirmLabel="Reset domain"
            danger
            busy={resetMutation.isPending}
            onConfirm={(reason) => resetMutation.mutate({ companyId: resetDialog.companyId, reason })}
            onClose={() => setResetDialog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
