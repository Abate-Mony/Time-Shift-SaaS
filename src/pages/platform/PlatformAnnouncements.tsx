import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Megaphone, Plus, X, Power } from "lucide-react";
import { TH, TD, PlatformTable, THead, TBody, Row, EmptyRow, ConfirmModal } from "@/components/platform/figma/primitives";
import customFetch from "@/utils/customFetch";
import {
  platformAnnouncementsQuery,
  createPlatformAnnouncement,
  setPlatformAnnouncementActive,
  type PlatformAnnouncementItem,
  type AnnouncementSeverity,
  type AnnouncementAudience,
  type Plan,
  type PlatformCompanyListItem,
} from "@/utils/platform-api";

export const platformAnnouncementsLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformAnnouncementsQuery);
  return null;
};

const SEVERITY_STYLE: Record<AnnouncementSeverity, string> = {
  info: "text-blue-700 bg-blue-50 border-blue-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  critical: "text-red-700 bg-red-50 border-red-200",
};

const ALL_PLANS: Plan[] = ["free", "starter", "professional", "enterprise"];

function CompanyPicker({ selected, onChange }: { selected: { id: string; name: string }[]; onChange: (v: { id: string; name: string }[]) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlatformCompanyListItem[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timeout = setTimeout(() => {
      customFetch
        .get<{ data: PlatformCompanyListItem[] }>("/platform/companies", { params: { search: query, limit: 5 } })
        .then((res) => setResults(res.data.data))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Companies</label>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {selected.map((c) => (
          <span key={c.id} className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-full px-2.5 py-1">
            {c.name}
            <button onClick={() => onChange(selected.filter((s) => s.id !== c.id))}><X size={10} /></button>
          </span>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search companies to add…"
        className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50"
      />
      {results.length > 0 && (
        <div className="mt-1 border border-[#E2E8F0] rounded-lg bg-white shadow-sm max-h-40 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                if (!selected.some((s) => s.id === c.id)) onChange([...selected, { id: c.id, name: c.name }]);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlatformAnnouncements() {
  const { data } = useQuery(platformAnnouncementsQuery);
  const queryClient = useQueryClient();
  const [createDialog, setCreateDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AnnouncementSeverity>("info");
  const [audience, setAudience] = useState<AnnouncementAudience>("all");
  const [targetPlans, setTargetPlans] = useState<Plan[]>([]);
  const [targetCompanies, setTargetCompanies] = useState<{ id: string; name: string }[]>([]);
  const [deactivateTarget, setDeactivateTarget] = useState<PlatformAnnouncementItem | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["platform", "announcements"] });

  const createMutation = useMutation({
    mutationFn: () =>
      createPlatformAnnouncement({
        message,
        severity,
        audience,
        targetPlans: audience === "plan" ? targetPlans : undefined,
        targetCompanies: audience === "company" ? targetCompanies.map((c) => c.id) : undefined,
      }),
    onSuccess: () => {
      toast.success("Announcement created. This action has been recorded in the audit log.");
      invalidate();
      setCreateDialog(false);
      setMessage("");
      setSeverity("info");
      setAudience("all");
      setTargetPlans([]);
      setTargetCompanies([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.msg ?? "Failed to create announcement."),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => setPlatformAnnouncementActive(id, false),
    onSuccess: () => {
      toast.success("Announcement deactivated.");
      invalidate();
      setDeactivateTarget(null);
    },
    onError: () => toast.error("Failed to deactivate announcement."),
  });

  const canCreate =
    message.trim().length > 0 &&
    (audience !== "plan" || targetPlans.length > 0) &&
    (audience !== "company" || targetCompanies.length > 0);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Messages pushed to tenant dashboards — maintenance windows, incidents, product notices.</p>
        </div>
        <button
          onClick={() => setCreateDialog(true)}
          className="h-9 px-3.5 flex items-center gap-1.5 text-sm font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <Plus size={14} /> New announcement
        </button>
      </div>

      <PlatformTable>
        <THead>
          <TH>Message</TH>
          <TH>Severity</TH>
          <TH>Audience</TH>
          <TH>Window</TH>
          <TH>Status</TH>
          <TH><span className="sr-only">Actions</span></TH>
        </THead>
        <TBody>
          {data?.length === 0 && (
            <EmptyRow colSpan={6}>
              <Megaphone size={20} className="text-slate-200 mx-auto mb-2" />
              No announcements yet.
            </EmptyRow>
          )}
          {data?.map((a) => (
            <Row key={a.id}>
              <TD className="text-sm text-slate-700 max-w-[320px] truncate">
                <span title={a.message}>{a.message}</span>
              </TD>
              <TD>
                <span className={`text-[11px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${SEVERITY_STYLE[a.severity]}`}>
                  {a.severity}
                </span>
              </TD>
              <TD className="text-xs text-slate-500">
                {a.audience === "all" ? "All companies" : a.audience === "plan" ? `Plan: ${a.targetPlans.join(", ")}` : `${a.targetCompanies.length} company(s)`}
              </TD>
              <TD className="text-xs text-slate-400 whitespace-nowrap">
                {dayjs(a.startsAt).format("D MMM")} – {a.endsAt ? dayjs(a.endsAt).format("D MMM") : "indefinite"}
              </TD>
              <TD>
                <span className={`text-[11px] font-semibold ${a.isActive ? "text-emerald-700" : "text-slate-400"}`}>
                  {a.isActive ? "Active" : "Inactive"}
                </span>
              </TD>
              <TD onClick={(e) => e.stopPropagation()}>
                {a.isActive && (
                  <button
                    onClick={() => setDeactivateTarget(a)}
                    className="h-7 px-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <Power size={11} /> Deactivate
                  </button>
                )}
              </TD>
            </Row>
          ))}
        </TBody>
      </PlatformTable>

      {createDialog && (
        <ConfirmModal
          title="New announcement"
          body="Appears as a dismissible banner on matching companies' dashboards."
          confirmLabel="Create"
          showReason={false}
          busy={createMutation.isPending}
          onConfirm={() => canCreate && createMutation.mutate()}
          onClose={() => setCreateDialog(false)}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Severity</label>
              <div className="flex gap-1.5">
                {(["info", "warning", "critical"] as AnnouncementSeverity[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      severity === s ? "bg-[#0F172A] text-white" : "text-slate-600 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Audience</label>
              <div className="flex gap-1.5">
                {([
                  { v: "all", label: "All companies" },
                  { v: "plan", label: "By plan" },
                  { v: "company", label: "Specific companies" },
                ] as { v: AnnouncementAudience; label: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setAudience(opt.v)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
                      audience === opt.v ? "bg-[#0F172A] text-white" : "text-slate-600 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {audience === "plan" && (
              <div className="flex flex-wrap gap-1.5">
                {ALL_PLANS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setTargetPlans((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))}
                    className={`h-7 px-2.5 rounded-full text-xs font-semibold capitalize border transition-colors ${
                      targetPlans.includes(p) ? "bg-[#0F172A] text-white border-[#0F172A]" : "text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {audience === "company" && <CompanyPicker selected={targetCompanies} onChange={setTargetCompanies} />}
          </div>
        </ConfirmModal>
      )}

      {deactivateTarget && (
        <ConfirmModal
          title="Deactivate this announcement?"
          body="It will stop appearing on tenant dashboards immediately. This can't be undone — create a new one to show it again."
          confirmLabel="Deactivate"
          danger
          showReason={false}
          busy={deactivateMutation.isPending}
          onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)}
          onClose={() => setDeactivateTarget(null)}
        />
      )}
    </div>
  );
}
