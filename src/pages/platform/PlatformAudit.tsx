import { useState } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import dayjs from "dayjs";
import { Check, X, Eye, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { TH, TD, PlatformTable, THead, TBody, Row, EmptyRow, SearchInput } from "@/components/platform/figma/primitives";
import { platformAuditQuery, platformAuditDetailQuery, type PlatformAuditListItem } from "@/utils/platform-api";

export const platformAuditLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformAuditQuery(params));
  return { searchValues: params };
};

// Direct port of the Figma source's AuditDetailDrawer — a real slide-in
// panel (fixed + motion.div), not the shadcn Sheet, which has different
// padding/animation and was the reason this page didn't visually match.
function AuditDetailDrawer({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { data: event } = useQuery(platformAuditDetailQuery(eventId));
  if (!event) return null;

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
            <p className="text-xs font-mono text-slate-400">{event.id}</p>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">{event.action}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            {event.result === "success" ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-600" />}
            <span className={`text-sm font-bold ${event.result === "success" ? "text-emerald-700" : "text-red-700"}`}>
              {event.result.charAt(0).toUpperCase() + event.result.slice(1)}
            </span>
          </div>

          {[
            { label: "Timestamp", value: dayjs(event.createdAt).format("D MMM YYYY, HH:mm:ss") },
            { label: "Actor", value: `${event.actorEmail} · ${event.actorPlatformRole.replace("_", " ")}` },
            { label: "Company", value: event.company ?? "—" },
            { label: "Target", value: `${event.targetType} · ${event.targetId}` },
            { label: "IP / Source", value: event.source?.ip ?? "—" },
          ].map((f) => (
            <div key={f.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
              <p className="text-sm text-slate-800 font-medium">{f.value}</p>
            </div>
          ))}

          {event.reason && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
              <p className="text-sm text-slate-800 leading-relaxed">{event.reason}</p>
            </div>
          )}

          {(event.before != null || event.after != null) && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Before → After</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Before</p>
                  <pre className="text-xs text-red-800 whitespace-pre-wrap font-mono">{JSON.stringify(event.before, null, 2)}</pre>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">After</p>
                  <pre className="text-xs text-emerald-800 whitespace-pre-wrap font-mono">{JSON.stringify(event.after, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-[#F1F5F9] pt-4">
            <p className="text-xs text-slate-400 italic">Audit records are immutable and cannot be modified.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PlatformAudit() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const { data } = useQuery(platformAuditQuery(searchValues));
  const [search, setSearch] = useState(searchValues.search ?? "");
  const [selected, setSelected] = useState<PlatformAuditListItem | null>(null);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchValues);
    if (search) params.set("search", search);
    else params.delete("search");
    params.delete("page");
    navigate(`/platform/audit?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/audit?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-0.5">Complete record of platform-level actions.</p>
      </div>

      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search action, actor, or company…" className="flex-1 max-w-sm" />
      </form>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>Timestamp</TH>
            <TH>Actor</TH>
            <TH>Action</TH>
            <TH>Company</TH>
            <TH>Target</TH>
            <TH>Result</TH>
            <TH>IP</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={8}>
                <ShieldCheck size={20} className="text-slate-200 mx-auto mb-2" />
                No audit events found.
              </EmptyRow>
            )}
            {data?.data.map((event) => (
              <Row key={event.id} onClick={() => setSelected(event)}>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(event.createdAt).format("D MMM, HH:mm")}</TD>
                <TD>
                  <p className="text-xs font-semibold text-slate-700">{event.actorEmail}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{event.actorPlatformRole.replace("_", " ")}</p>
                </TD>
                <TD><code className="text-[11px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 font-mono">{event.action}</code></TD>
                <TD className="text-xs text-slate-600">{event.company ?? "—"}</TD>
                <TD className="text-xs text-slate-500">{event.targetType} · {event.targetId}</TD>
                <TD>
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${event.result === "success" ? "text-emerald-700" : event.result === "failed" ? "text-red-700" : "text-amber-700"}`}>
                    {event.result === "success" ? <Check size={10} /> : <X size={10} />}
                    {event.result.charAt(0).toUpperCase() + event.result.slice(1)}
                  </span>
                </TD>
                <TD className="font-mono text-[10px] text-slate-400">—</TD>
                <TD onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setSelected(event)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-colors">
                    <Eye size={12} />
                  </button>
                </TD>
              </Row>
            ))}
          </TBody>
        </PlatformTable>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between rounded-b-lg">
            <p className="text-xs text-slate-400">{data.pagination.total} events · page {data.pagination.page} of {data.pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => goToPage(data.pagination.page - 1)}
                className="h-7 px-2.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => goToPage(data.pagination.page + 1)}
                className="h-7 px-2.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && <AuditDetailDrawer eventId={selected.id} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
