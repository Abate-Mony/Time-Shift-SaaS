import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Timer, X as XIcon } from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge, TH, TD, PlatformTable, THead, TBody, Row, RowMenu, ConfirmModal } from "@/components/platform/figma/primitives";
import { PlatformPreviewBanner } from "@/components/platform/PlatformPreviewBanner";

// No trialStartedAt/trialEndsAt tracking exists in the backend yet — this
// screen agrees the shape of the UI ahead of that work. Ported directly
// from the Figma source's TRIALS/TrialsScreen. "End trial" shows a preview
// notice rather than doing anything, since there is nothing real to call.
const TRIALS = [
  { id: "t1", company: "SwiftEvent Services", plan: "Professional", started: "10 Sep 2026", ends: "25 Sep 2026", daysLeft: 3, workers: 22, activity: "high", status: "ending_soon" },
  { id: "t2", company: "MediCare Solutions", plan: "Starter", started: "20 Sep 2026", ends: "4 Oct 2026", daysLeft: 12, workers: 3, activity: "medium", status: "active" },
  { id: "t3", company: "NovaCare Ltd", plan: "Free", started: "22 Sep 2026", ends: "6 Oct 2026", daysLeft: 14, workers: 2, activity: "low", status: "active" },
  { id: "t4", company: "FacilitiesFirst Ltd", plan: "Starter", started: "10 May 2026", ends: "24 May 2026", daysLeft: 0, workers: 0, activity: "low", status: "expired" },
] as const;

const SUMMARY: Array<{ label: string; value: string; color?: string }> = [
  { label: "Active trials", value: "3" },
  { label: "Ending in 24h", value: "0" },
  { label: "Ending in 3 days", value: "1", color: "text-amber-700" },
  { label: "Expired", value: "1", color: "text-slate-400" },
  { label: "Converted", value: "8", color: "text-emerald-700" },
];

export function PlatformTrials() {
  const [extendModal, setExtendModal] = useState<(typeof TRIALS)[number] | null>(null);

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Trials</h1>
        <p className="text-sm text-slate-500 mt-0.5">Monitor and manage company trials.</p>
      </div>

      <PlatformPreviewBanner reason="Trial tracking doesn't exist in the backend yet, so this table isn't connected to anything live." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {SUMMARY.map((m) => (
          <div key={m.label} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${m.color ?? "text-slate-900"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <PlatformTable>
        <THead>
          <TH>Company</TH>
          <TH>Plan</TH>
          <TH>Started</TH>
          <TH>Ends</TH>
          <TH>Days left</TH>
          <TH>Workers</TH>
          <TH>Activity</TH>
          <TH>Status</TH>
          <TH><span className="sr-only">Actions</span></TH>
        </THead>
        <TBody>
          {TRIALS.map((t) => (
            <Row key={t.id}>
              <TD><p className="font-semibold text-slate-800 text-sm">{t.company}</p></TD>
              <TD className="text-xs font-semibold text-slate-700">{t.plan}</TD>
              <TD className="text-xs text-slate-400 whitespace-nowrap">{t.started}</TD>
              <TD className="text-xs text-slate-400 whitespace-nowrap">{t.ends}</TD>
              <TD>
                <span className={`text-sm font-bold tabular-nums ${t.daysLeft <= 3 && t.daysLeft > 0 ? "text-amber-600" : t.daysLeft === 0 ? "text-slate-400" : "text-slate-800"}`}>
                  {t.daysLeft === 0 ? "—" : `${t.daysLeft}d`}
                </span>
              </TD>
              <TD className="text-sm font-semibold text-slate-700">{t.workers}</TD>
              <TD>
                <span className={`text-[11px] font-semibold capitalize ${t.activity === "high" ? "text-emerald-600" : t.activity === "medium" ? "text-blue-600" : "text-slate-400"}`}>
                  {t.activity}
                </span>
              </TD>
              <TD><StatusBadge status={t.status} /></TD>
              <TD>
                <RowMenu
                  items={[
                    { label: "Extend trial", icon: Timer, onClick: () => setExtendModal(t) },
                    { label: "End trial", icon: XIcon, danger: true, onClick: () => toast("This is a design preview — there's no trial-tracking backend yet.") },
                  ]}
                />
              </TD>
            </Row>
          ))}
        </TBody>
      </PlatformTable>

      <AnimatePresence>
        {extendModal && (
          <ConfirmModal
            title={`Extend trial — ${extendModal.company}`}
            body={`Current end date: ${extendModal.ends}. Provide the new end date and an internal reason for extending the trial.`}
            consequence="This action will be recorded in the platform audit log."
            confirmLabel="Extend trial"
            onConfirm={() => {
              toast("This is a design preview — there's no trial-tracking backend yet.");
              setExtendModal(null);
            }}
            onClose={() => setExtendModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
