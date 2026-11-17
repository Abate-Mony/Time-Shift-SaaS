import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  CalendarClock, CheckCircle2, Circle, Download, ExternalLink, Eye, EyeOff, RefreshCw, RotateCcw, Trash2, X,
} from "lucide-react";
import { ConfirmModal } from "@/components/platform/figma/primitives";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import {
  addCompanyNote, cancelCompanyDeletion, deleteCompanyNote, endSupportAccess, exportCompanyData, extendCompanyTrial,
  platformCompanyApiKeysQuery, platformCompanyNotesQuery, platformErrorMessage, platformFeatureFlagsQuery, platformSupportAccessQuery,
  platformSupportInvoicesQuery, platformSupportJobsQuery, retryCompanyPayment, revokeCompanyApiKey, scheduleCompanyDeletion,
  startSupportAccess, updateCompanyFeatureFlags, updateCompanyTags,
  type PlatformApiKey, type PlatformCompanyDetail, type PlatformTag,
} from "@/utils/platform-api";
import { ActionButton, Card, HealthBadge, TagChip, TAG_LABELS } from "./SupportBits";

const useRefreshCompany = (companyId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
    queryClient.invalidateQueries({ queryKey: ["platform", "audit"] });
  };
};

dayjs.extend(utc);

const fmt = (d: string | null | undefined, pattern = "D MMM YYYY") => (d ? dayjs(d).format(pattern) : "—");

// ─── Health ──────────────────────────────────────────────────────────────

export function HealthCard({ company }: { company: PlatformCompanyDetail }) {
  const h = company.health;
  if (!h) return null;
  const s = h.signals;
  const step = (done: boolean, label: string) => (
    <li className="flex items-center gap-1.5 text-xs text-slate-600">
      {done ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Circle size={13} className="text-slate-300" />}
      {label}
    </li>
  );
  return (
    <Card title="Health" action={<HealthBadge level={h.level} score={h.score} />}>
      {h.reasons.length > 0 ? (
        <ul className="mb-3 flex flex-col gap-1">
          {h.reasons.map((r) => (
            <li key={r} className="text-xs text-slate-700 flex items-start gap-1.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-400 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-slate-500">No issues found.</p>
      )}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <dt className="text-slate-400">Last manager login</dt>
        <dd className="font-semibold text-slate-700 text-right">{s.lastManagerLoginAt ? fmt(s.lastManagerLoginAt) : "Never"}</dd>
        <dt className="text-slate-400">Jobs (last 30 days)</dt>
        <dd className="font-semibold text-slate-700 text-right tabular-nums">{s.jobsLast30Days}</dd>
        <dt className="text-slate-400">Active workers</dt>
        <dd className="font-semibold text-slate-700 text-right tabular-nums">{s.activeWorkers}</dd>
        <dt className="text-slate-400">Subscription</dt>
        <dd className="font-semibold text-slate-700 text-right capitalize">{s.subscriptionStatus?.replace(/_/g, " ") ?? "None"}</dd>
      </dl>
      <p className="mt-3 mb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Onboarding</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {step(s.onboarding.firstJob, "First job")}
        {step(s.onboarding.workerInvited, "First worker")}
        {step(s.onboarding.firstInvoice, "First invoice")}
      </ul>
    </Card>
  );
}

// ─── Tags ────────────────────────────────────────────────────────────────

export function TagsCard({ company }: { company: PlatformCompanyDetail }) {
  const { canSupport } = usePlatformPermissions();
  const refresh = useRefreshCompany(company.id);
  const mutation = useMutation({
    mutationFn: (tags: PlatformTag[]) => updateCompanyTags(company.id, tags),
    onSuccess: refresh,
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't update tags.")),
  });
  const toggle = (t: PlatformTag) =>
    mutation.mutate(company.tags.includes(t) ? company.tags.filter((x) => x !== t) : [...company.tags, t]);
  return (
    <Card title="Tags">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(TAG_LABELS) as PlatformTag[]).map((t) => {
          const on = company.tags.includes(t);
          return canSupport ? (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              disabled={mutation.isPending}
              onClick={() => toggle(t)}
              className={`h-7 px-2.5 rounded-full border text-[11px] font-semibold transition-colors ${
                on ? "bg-[#1E3A5F] border-[#1E3A5F] text-white" : "bg-white border-[#E2E8F0] text-slate-500 hover:border-slate-400"
              }`}
            >
              {TAG_LABELS[t]}
            </button>
          ) : on ? (
            <TagChip key={t} tag={t} />
          ) : null;
        })}
        {!canSupport && company.tags.length === 0 && <p className="text-xs text-slate-400">No tags.</p>}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Internal only — the company never sees these.</p>
    </Card>
  );
}

// ─── Trial & billing ─────────────────────────────────────────────────────

export function BillingCard({ company }: { company: PlatformCompanyDetail }) {
  const { canBilling } = usePlatformPermissions();
  const refresh = useRefreshCompany(company.id);
  const [trialOpen, setTrialOpen] = useState(false);
  const [days, setDays] = useState(14);
  const [retryOpen, setRetryOpen] = useState(false);
  const b = company.billing;
  const trialActive = b.trialEndsAt && dayjs(b.trialEndsAt).isAfter(dayjs());
  const paidActive = b.subscriptionStatus === "active";

  const trial = useMutation({
    mutationFn: (reason: string) => extendCompanyTrial(company.id, days, reason),
    onSuccess: (d) => { toast.success(d.msg ?? "Trial extended."); refresh(); setTrialOpen(false); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't extend the trial.")),
  });
  const retry = useMutation({
    mutationFn: (reason: string) => retryCompanyPayment(company.id, reason),
    onSuccess: (d) => { toast.success(d.msg ?? "Payment retried."); refresh(); setRetryOpen(false); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't retry the payment.")),
  });

  return (
    <Card
      title="Trial & billing"
      action={
        b.stripeDashboardUrl ? (
          <a href={b.stripeDashboardUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-[#1E3A5F] hover:underline flex items-center gap-1">
            Open in Stripe <ExternalLink size={11} />
          </a>
        ) : undefined
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <dt className="text-slate-400">Subscription</dt>
        <dd className="font-semibold text-slate-700 text-right capitalize">
          {b.subscriptionStatus?.replace(/_/g, " ") ?? "None"}
          {b.cancelAtPeriodEnd && <span className="ml-1 text-amber-700">(cancelling)</span>}
        </dd>
        <dt className="text-slate-400">Current period ends</dt>
        <dd className="font-semibold text-slate-700 text-right">{fmt(b.currentPeriodEnd)}</dd>
        <dt className="text-slate-400">Trial</dt>
        <dd className={`font-semibold text-right ${trialActive ? "text-blue-700" : "text-slate-700"}`}>
          {b.trialEndsAt ? `${trialActive ? "Ends" : "Ended"} ${fmt(b.trialEndsAt)}` : "No trial"}
        </dd>
      </dl>
      {canBilling && (
        <div className="flex flex-wrap gap-2 mt-4">
          <ActionButton onClick={() => setTrialOpen(true)} disabled={paidActive} title={paidActive ? "Has a paid subscription" : undefined}>
            <CalendarClock size={12} /> Extend trial
          </ActionButton>
          <ActionButton onClick={() => setRetryOpen(true)} disabled={!b.stripeCustomerId} title={!b.stripeCustomerId ? "No Stripe customer" : undefined}>
            <RefreshCw size={12} /> Retry failed payment
          </ActionButton>
        </div>
      )}
      <AnimatePresence>
        {trialOpen && (
          <ConfirmModal
            title="Extend trial"
            body={`Adds days to ${company.name}'s trial${trialActive ? "" : " starting today"}. A company back on Free returns to Professional for the trial.`}
            confirmLabel={`Extend by ${days} days`}
            busy={trial.isPending}
            onConfirm={(reason) => trial.mutate(reason)}
            onClose={() => setTrialOpen(false)}
          >
            <div className="flex gap-1.5">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`h-8 px-3 rounded-lg border text-xs font-semibold ${days === d ? "bg-[#1E3A5F] text-white border-[#1E3A5F]" : "border-[#E2E8F0] text-slate-600"}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </ConfirmModal>
        )}
        {retryOpen && (
          <ConfirmModal
            title="Retry failed payment?"
            body="Asks Stripe to collect the company's latest unpaid invoice again, using the card on file."
            confirmLabel="Retry payment"
            busy={retry.isPending}
            onConfirm={(reason) => retry.mutate(reason)}
            onClose={() => setRetryOpen(false)}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Notes ───────────────────────────────────────────────────────────────

export function NotesPanel({ companyId }: { companyId: string }) {
  const { canSupport, isSuper } = usePlatformPermissions();
  const queryClient = useQueryClient();
  const { data: notes } = useQuery(platformCompanyNotesQuery(companyId));
  const [body, setBody] = useState("");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "notes"] });
  const add = useMutation({
    mutationFn: () => addCompanyNote(companyId, body),
    onSuccess: () => { setBody(""); refresh(); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't save the note.")),
  });
  const remove = useMutation({
    mutationFn: (noteId: string) => deleteCompanyNote(companyId, noteId),
    onSuccess: refresh,
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't delete the note.")),
  });

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {canSupport && (
        <form
          onSubmit={(e) => { e.preventDefault(); if (body.trim()) add.mutate(); }}
          className="bg-white border border-[#E2E8F0] rounded-lg p-4 flex flex-col gap-2"
        >
          <label htmlFor="note" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add a note</label>
          <textarea
            id="note"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="e.g. Called the owner about invoice numbering — fixed, follow up Friday."
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 resize-y"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!body.trim() || add.isPending}
              className="h-8 px-4 bg-[#1E3A5F] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              {add.isPending ? "Saving…" : "Save note"}
            </button>
          </div>
        </form>
      )}
      <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F1F5F9]">
        {notes?.length === 0 && <p className="p-4 text-sm text-slate-400">No notes yet.</p>}
        {notes?.map((n) => (
          <article key={n.id} className="p-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600">{n.author.email}</span> · {fmt(n.createdAt, "D MMM YYYY, HH:mm")}
              </p>
              {(isSuper || canSupport) && (
                <button
                  type="button"
                  aria-label="Delete note"
                  onClick={() => window.confirm("Delete this note?") && remove.mutate(n.id)}
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-red-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── API keys ──────────────────────────────────────────────────────────────

export function ApiKeysPanel({ companyId }: { companyId: string }) {
  const { canSupport } = usePlatformPermissions();
  const queryClient = useQueryClient();
  const { data: keys } = useQuery(platformCompanyApiKeysQuery(companyId));
  const [revoking, setRevoking] = useState<PlatformApiKey | null>(null);
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "api-keys"] });
    queryClient.invalidateQueries({ queryKey: ["platform", "audit"] });
  };
  const revoke = useMutation({
    mutationFn: (reason: string) => revokeCompanyApiKey(companyId, revoking!.id, reason),
    onSuccess: () => { toast.success(`"${revoking?.name}" revoked.`); setRevoking(null); refresh(); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't revoke this key.")),
  });

  return (
    <div className="max-w-2xl flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Credentials this company issued for its own external integrations (its booking website, Zapier, etc.) —
        never the raw key, just what it was for and whether it's still active.
      </p>
      <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F1F5F9]">
        {keys?.length === 0 && <p className="p-4 text-sm text-slate-400">No API keys issued.</p>}
        {keys?.map((k) => (
          <div key={k.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{k.name}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">…{k.keyPrefix}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Created {fmt(k.createdAt)} · Last used {k.lastUsedAt ? fmt(k.lastUsedAt, "D MMM YYYY, HH:mm") : "never"}
              </p>
            </div>
            {k.isActive ? (
              canSupport && (
                <button
                  type="button"
                  onClick={() => setRevoking(k)}
                  className="h-8 px-3 shrink-0 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                >
                  Revoke
                </button>
              )
            ) : (
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Revoked {fmt(k.revokedAt)}</span>
            )}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {revoking && (
          <ConfirmModal
            title="Revoke this API key?"
            body={`"${revoking.name}" will stop working immediately — any integration using it (e.g. a booking website) will fail until the company issues a new one.`}
            confirmLabel="Revoke"
            danger
            busy={revoke.isPending}
            onConfirm={(reason) => revoke.mutate(reason)}
            onClose={() => setRevoking(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Support access (read-only "view as") ────────────────────────────────

export function SupportAccessPanel({ company }: { company: PlatformCompanyDetail }) {
  const { canSupport } = usePlatformPermissions();
  const queryClient = useQueryClient();
  const { data: session } = useQuery({ ...platformSupportAccessQuery(company.id), refetchInterval: 30_000 });
  const [startOpen, setStartOpen] = useState(false);
  const [minutes, setMinutes] = useState<15 | 30 | 60>(30);
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [view, setView] = useState<"jobs" | "invoices">("jobs");
  const [from, setFrom] = useState(dayjs().subtract(7, "day").format("YYYY-MM-DD"));
  const [to, setTo] = useState(dayjs().add(14, "day").format("YYYY-MM-DD"));
  const live = session && dayjs(session.expiresAt).isAfter(dayjs()) ? session : null;
  const { data: jobs, isFetching: jobsLoading, error: jobsError } = useQuery(platformSupportJobsQuery(company.id, live?.id, from, to));
  const { data: invoices, error: invoicesError } = useQuery({ ...platformSupportInvoicesQuery(company.id, live?.id), enabled: !!live && view === "invoices" });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["platform", "companies", company.id, "support-access"] });
    queryClient.invalidateQueries({ queryKey: ["platform", "audit"] });
  };
  const start = useMutation({
    mutationFn: (reason: string) => startSupportAccess(company.id, reason, minutes, notifyOwner),
    onSuccess: () => { refresh(); setStartOpen(false); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't start support access.")),
  });
  const end = useMutation({ mutationFn: () => endSupportAccess(company.id), onSuccess: refresh });

  if (!canSupport) {
    return <p className="text-sm text-slate-500">Support access needs the Support admin or Super admin role.</p>;
  }

  if (!live) {
    return (
      <div className="max-w-xl bg-white border border-[#E2E8F0] rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Eye size={16} className="text-slate-500" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">View {company.name}'s data</h2>
            <p className="text-sm text-slate-500 mt-1">
              Opens a short, <strong>read-only</strong> window onto this company's jobs and invoices to help debug a problem. You give a reason,
              it ends automatically, it's recorded in the audit log, and the owner is emailed by default.
            </p>
            <button
              type="button"
              onClick={() => setStartOpen(true)}
              className="mt-3 h-9 px-4 bg-[#1E3A5F] text-white text-sm font-semibold rounded-lg"
            >
              Start support access
            </button>
          </div>
        </div>
        <AnimatePresence>
          {startOpen && (
            <ConfirmModal
              title="Start support access"
              body={`Read-only access to ${company.name}'s jobs and invoices.`}
              confirmLabel="Start"
              busy={start.isPending}
              onConfirm={(reason) => start.mutate(reason)}
              onClose={() => setStartOpen(false)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                  {([15, 30, 60] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMinutes(m)}
                      className={`h-8 px-3 rounded-lg border text-xs font-semibold ${minutes === m ? "bg-[#1E3A5F] text-white border-[#1E3A5F]" : "border-[#E2E8F0] text-slate-600"}`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={notifyOwner} onChange={(e) => setNotifyOwner(e.target.checked)} className="w-4 h-4 accent-[#1E3A5F]" />
                  Email the company owner that support accessed their account
                </label>
              </div>
            </ConfirmModal>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const minsLeft = Math.max(0, dayjs(live.expiresAt).diff(dayjs(), "minute"));
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <Eye size={15} className="text-blue-700 shrink-0" />
        <p className="text-sm text-blue-900 flex-1 min-w-0">
          <strong>Read-only support access</strong> · ends {fmt(live.expiresAt, "HH:mm")} ({minsLeft} min left) · Reason: {live.reason}
          {live.ownerNotified && <span className="text-blue-700"> · owner emailed</span>}
        </p>
        <button type="button" onClick={() => end.mutate()} className="h-8 px-3 text-xs font-semibold text-blue-900 border border-blue-300 rounded-lg hover:bg-blue-100 flex items-center gap-1.5">
          <EyeOff size={12} /> End now
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["jobs", "invoices"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold capitalize ${view === v ? "bg-[#1E3A5F] text-white" : "bg-white border border-[#E2E8F0] text-slate-600"}`}
          >
            {v}
          </button>
        ))}
        {view === "jobs" && (
          <div className="flex items-center gap-1.5 ml-auto text-xs text-slate-500">
            <input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="h-8 px-2 border border-[#E2E8F0] rounded-lg" />
            –
            <input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="h-8 px-2 border border-[#E2E8F0] rounded-lg" />
          </div>
        )}
      </div>

      {view === "jobs" ? (
        <div className={`bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto ${jobsLoading ? "opacity-60" : ""}`}>
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Job</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Workers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {jobs?.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400">No jobs in this range.</td></tr>}
              {jobsError && <tr><td colSpan={4} className="px-3 py-6 text-center text-red-600">{platformErrorMessage(jobsError, "Couldn't load jobs.")}</td></tr>}
              {jobs?.map((j) => (
                <tr key={j.id} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-600">
                    {dayjs.utc(j.date).format("ddd D MMM")}
                    <div className="text-slate-400 tabular-nums">{j.startTime}–{j.endTime}</div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-slate-800">{j.title}</p>
                    <p className="text-xs text-slate-400">{[j.client, j.location].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-3 py-2 text-xs capitalize text-slate-600">{j.status}</td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {j.workers.length === 0 && <span className="text-amber-700">No one assigned</span>}
                    {j.workers.map((w, i) => (
                      <div key={i}>
                        {w.name} <span className="text-slate-400">· {w.status}{w.clockIn ? ` · in ${dayjs(w.clockIn).format("HH:mm")}` : ""}{w.clockOut ? ` · out ${dayjs(w.clockOut).format("HH:mm")}` : ""}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] text-[11px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Invoice</th>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-right px-3 py-2">Total</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {invoices?.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No invoices.</td></tr>}
              {invoicesError && <tr><td colSpan={5} className="px-3 py-6 text-center text-red-600">{platformErrorMessage(invoicesError, "Couldn't load invoices.")}</td></tr>}
              {invoices?.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2 font-semibold text-slate-800">{i.number}</td>
                  <td className="px-3 py-2 text-slate-600">{i.client ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-800">£{Number(i.total ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-xs capitalize text-slate-600">{i.status}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{fmt(i.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Settings: feature flags + danger zone ───────────────────────────────

export function SettingsPanel({ company }: { company: PlatformCompanyDetail }) {
  const { isSuper } = usePlatformPermissions();
  const refresh = useRefreshCompany(company.id);
  const { data: catalog } = useQuery(platformFeatureFlagsQuery);
  const [flagDraft, setFlagDraft] = useState<string[] | null>(null);
  const flags = flagDraft ?? company.featureFlags;
  const [flagsOpen, setFlagsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const saveFlags = useMutation({
    mutationFn: (reason: string) => updateCompanyFeatureFlags(company.id, flags, reason),
    onSuccess: () => { toast.success("Feature flags saved."); setFlagDraft(null); setFlagsOpen(false); refresh(); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't save feature flags.")),
  });
  const doExport = useMutation({
    mutationFn: (reason: string) => exportCompanyData(company.id, reason),
    onSuccess: () => { toast.success("Export downloaded."); setExportOpen(false); refresh(); },
    onError: () => toast.error("Couldn't export the data."),
  });
  const schedule = useMutation({
    mutationFn: (reason: string) => scheduleCompanyDeletion(company.id, company.name, reason),
    onSuccess: (d) => { toast.success(d.msg ?? "Deletion scheduled."); setDeleteOpen(false); refresh(); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't schedule deletion.")),
  });
  const cancel = useMutation({
    mutationFn: (reason: string) => cancelCompanyDeletion(company.id, reason),
    onSuccess: () => { toast.success("Deletion cancelled."); setCancelOpen(false); refresh(); },
    onError: (e) => toast.error(platformErrorMessage(e, "Couldn't cancel deletion.")),
  });

  const dirty = flagDraft !== null && [...flagDraft].sort().join() !== [...company.featureFlags].sort().join();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <Card title="Feature flags">
        <ul className="flex flex-col gap-3">
          {catalog?.data.map((f) => (
            <li key={f.key} className="flex items-start gap-3">
              <input
                id={`flag-${f.key}`}
                type="checkbox"
                disabled={!isSuper}
                checked={flags.includes(f.key)}
                onChange={(e) => setFlagDraft(e.target.checked ? [...flags, f.key] : flags.filter((k) => k !== f.key))}
                className="mt-0.5 w-4 h-4 accent-[#1E3A5F]"
              />
              <label htmlFor={`flag-${f.key}`} className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{f.label}</span>
                <span className="block text-xs text-slate-500">{f.description}</span>
              </label>
            </li>
          ))}
        </ul>
        {isSuper && (
          <div className="flex justify-end gap-2 mt-4">
            {dirty && <ActionButton onClick={() => setFlagDraft(null)}>Discard</ActionButton>}
            <button
              type="button"
              disabled={!dirty}
              onClick={() => setFlagsOpen(true)}
              className="h-8 px-4 bg-[#1E3A5F] text-white text-xs font-semibold rounded-lg disabled:opacity-40"
            >
              Save flags
            </button>
          </div>
        )}
      </Card>

      <Card title="Data & deletion">
        {company.deletionScheduledAt && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-bold text-red-800">Deletion scheduled for {fmt(company.deletionScheduledAt)}</p>
            <p className="text-xs text-red-700 mt-0.5">The company is disabled until then, and all its data is deleted on that date.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Export data</p>
              <p className="text-xs text-slate-500">Everything the company holds, as a JSON file (data access requests).</p>
            </div>
            <ActionButton onClick={() => setExportOpen(true)} disabled={!isSuper}><Download size={12} /> Export</ActionButton>
          </div>
          <div className="flex items-start justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
            <div>
              <p className="text-sm font-semibold text-slate-800">{company.deletionScheduledAt ? "Cancel deletion" : "Delete company"}</p>
              <p className="text-xs text-slate-500">
                {company.deletionScheduledAt
                  ? "Stops the deletion and restores the company's previous status."
                  : "Disables the company now and permanently deletes its data after 30 days."}
              </p>
            </div>
            {company.deletionScheduledAt ? (
              <ActionButton onClick={() => setCancelOpen(true)} disabled={!isSuper}><RotateCcw size={12} /> Cancel deletion</ActionButton>
            ) : (
              <ActionButton danger onClick={() => setDeleteOpen(true)} disabled={!isSuper}><Trash2 size={12} /> Delete…</ActionButton>
            )}
          </div>
          {!isSuper && <p className="text-[11px] text-slate-400">Only super admins can export or delete.</p>}
        </div>
      </Card>

      <AnimatePresence>
        {flagsOpen && (
          <ConfirmModal
            title="Save feature flags"
            body={`Turns on: ${flags.join(", ") || "none"}.`}
            confirmLabel="Save"
            busy={saveFlags.isPending}
            onConfirm={(reason) => saveFlags.mutate(reason)}
            onClose={() => setFlagsOpen(false)}
          />
        )}
        {exportOpen && (
          <ConfirmModal
            title={`Export ${company.name}'s data?`}
            body="Downloads users (no passwords or tokens), clients, sites, jobs, shifts, quotes, invoices and time off as JSON. Handle the file as personal data."
            confirmLabel="Download export"
            busy={doExport.isPending}
            onConfirm={(reason) => doExport.mutate(reason)}
            onClose={() => setExportOpen(false)}
          />
        )}
        {deleteOpen && (
          <ConfirmModal
            title={`Delete ${company.name}?`}
            body="The company is disabled straight away. After 30 days all of its data — users, jobs, timesheets, invoices — is permanently deleted. You can cancel any time before then."
            consequence="Export the data first if the customer asked for a copy. A company with an active paid subscription must be cancelled in Stripe first."
            confirmLabel="Schedule deletion"
            danger
            confirmText={company.name}
            busy={schedule.isPending}
            onConfirm={(reason) => schedule.mutate(reason)}
            onClose={() => setDeleteOpen(false)}
          />
        )}
        {cancelOpen && (
          <ConfirmModal
            title="Cancel deletion?"
            body="The company's data is kept and its previous status is restored."
            confirmLabel="Cancel deletion"
            busy={cancel.isPending}
            onConfirm={(reason) => cancel.mutate(reason)}
            onClose={() => setCancelOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

