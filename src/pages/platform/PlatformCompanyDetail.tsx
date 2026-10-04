import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ChevronLeft, AlertTriangle, CreditCard, ShieldCheck, Ban, Trash2, RotateCcw, RefreshCw, Check, X as XIcon } from "lucide-react";
import {
  Avatar, StatusBadge, TH, TD, THead, TBody, Row, EmptyRow, RowMenu, ConfirmModal,
} from "@/components/platform/figma/primitives";
import {
  platformCompanyDetailQuery,
  platformCompanyUsersQuery,
  platformCompanyUsageQuery,
  platformCompanyEmailQuery,
  platformAuditQuery,
  updateCompanyStatus,
  updateCompanyPlanOverride,
  retryEmailDomainVerification,
  resetEmailDomain,
  type Plan,
  type CompanyStatus,
} from "@/utils/platform-api";

export const platformCompanyDetailLoader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
  const companyId = params.companyId as string;
  await queryClient.ensureQueryData(platformCompanyDetailQuery(companyId));
  return null;
};

const TABS = ["overview", "users", "usage", "email", "activity"] as const;
type Tab = (typeof TABS)[number];

const pct = (a: number, b: number) => (b === 0 ? "0%" : `${Math.min(100, Math.round((a / b) * 100))}%`);

export function PlatformCompanyDetail() {
  const { companyId } = useParams() as { companyId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: company } = useQuery(platformCompanyDetailQuery(companyId));
  const { data: companyUsers } = useQuery(platformCompanyUsersQuery(companyId, {}));
  const { data: usage } = useQuery(platformCompanyUsageQuery(companyId));
  const { data: emailSettings } = useQuery(platformCompanyEmailQuery(companyId));
  const { data: activity } = useQuery(platformAuditQuery({ company: companyId }));

  const [tab, setTab] = useState<Tab>("overview");
  const [statusDialog, setStatusDialog] = useState<CompanyStatus | null>(null);
  const [planDialog, setPlanDialog] = useState(false);
  const [plan, setPlan] = useState<Plan>("free");
  const [resetDialog, setResetDialog] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (vars: { status: CompanyStatus; reason: string }) => updateCompanyStatus(companyId, vars.status, vars.reason),
    onSuccess: () => {
      toast.success("Company status updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
      setStatusDialog(null);
    },
    onError: () => toast.error("Failed to update company status."),
  });

  const planMutation = useMutation({
    mutationFn: (vars: { plan: Plan; reason: string }) => updateCompanyPlanOverride(companyId, vars.plan, vars.reason),
    onSuccess: () => {
      toast.success("Company plan updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
      setPlanDialog(false);
    },
    onError: () => toast.error("Failed to update company plan."),
  });

  const resetDomainMutation = useMutation({
    mutationFn: (reason: string) => resetEmailDomain(companyId, reason),
    onSuccess: () => {
      toast.success("Sending domain reset. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "email"] });
      setResetDialog(false);
    },
    onError: () => toast.error("Failed to reset the sending domain."),
  });

  const retryVerificationMutation = useMutation({
    mutationFn: () => retryEmailDomainVerification(companyId),
    onSuccess: () => toast.success("Verification re-checked."),
    onError: () => toast.error("Failed to retry verification."),
  });

  if (!company) return null;

  const limit = company.workerUsage.limit ?? 0;
  const hasLimit = !company.workerUsage.unlimited && limit > 0;

  return (
    <div className="p-6 flex flex-col gap-5">
      {company.status !== "active" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Company {company.status === "suspended" ? "suspended" : "disabled"}</p>
              <p className="text-sm text-amber-700 mt-0.5">Users from this company cannot access OnClockly.</p>
            </div>
            <button
              onClick={() => setStatusDialog("active")}
              className="h-7 px-3 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition-colors shrink-0"
            >
              Restore company
            </button>
          </div>
        </div>
      )}

      <div>
        <button onClick={() => navigate("/platform/companies")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <ChevronLeft size={12} /> All companies
        </button>
        <div className="flex items-start gap-4">
          <Avatar name={company.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{company.name}</h1>
              <StatusBadge status={company.status} />
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-400 font-mono">ID: {company.id}</span>
              <span className="text-xs text-slate-400">{company.owner?.email ?? "—"}</span>
              <span className="text-xs text-slate-400">Created {dayjs(company.createdAt).format("D MMM YYYY")}</span>
              <span className="text-xs font-semibold text-slate-600 capitalize">{company.plan}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RowMenu
              items={[
                { label: "Change plan", icon: CreditCard, onClick: () => { setPlan(company.plan); setPlanDialog(true); } },
                { label: "Open audit history", icon: ShieldCheck, onClick: () => navigate(`/platform/audit?company=${company.id}`) },
                company.status === "active"
                  ? { label: "Suspend company", icon: Ban, danger: true, onClick: () => setStatusDialog("suspended") }
                  : { label: "Restore company", icon: RotateCcw, onClick: () => setStatusDialog("active") },
                { label: "Disable company", icon: Trash2, danger: true, onClick: () => setStatusDialog("disabled") },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 border-b border-[#E2E8F0] -mb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-9 px-4 text-sm capitalize transition-colors border-b-2 ${
              tab === t ? "border-[#1E3A5F] text-[#1E3A5F] font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F8FAFC]">
            <div className="px-4 py-3"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Information</p></div>
            {[
              { label: "Company name", value: company.name },
              { label: "Owner", value: company.owner?.email ?? "—" },
              { label: "Business type", value: company.businessType ?? "—" },
              { label: "Country", value: company.country ?? "—" },
              { label: "Created at", value: dayjs(company.createdAt).format("D MMM YYYY") },
            ].map((f) => (
              <div key={f.label} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">{f.label}</span>
                <span className="text-xs font-semibold text-slate-700">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan & Usage</p>
                <button
                  onClick={() => { setPlan(company.plan); setPlanDialog(true); }}
                  className="text-[11px] font-semibold text-[#1E3A5F] hover:underline"
                >
                  Change plan
                </button>
              </div>
              <p className="text-lg font-bold text-slate-900 mb-1 capitalize">{company.plan}</p>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">Worker seats</span>
                <span className="font-bold text-slate-700">
                  {company.workerUsage.active} / {company.workerUsage.unlimited ? "Unlimited" : company.workerUsage.limit}
                </span>
              </div>
              {hasLimit && (
                <div className="w-full h-2 bg-slate-100 rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${company.workerUsage.active / limit > 0.9 ? "bg-amber-400" : "bg-[#1E3A5F]"}`}
                    style={{ width: pct(company.workerUsage.active, limit) }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Product Usage</p>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(company.counts).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-base font-bold text-slate-900">{value}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{key}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <THead>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Created</TH>
            </THead>
            <TBody>
              {companyUsers?.data.length === 0 && <EmptyRow colSpan={5}>No users found.</EmptyRow>}
              {companyUsers?.data.map((u) => (
                <Row key={u.id}>
                  <TD><p className="font-semibold text-slate-800 text-sm">{u.name}</p></TD>
                  <TD className="text-xs text-slate-500">{u.email}</TD>
                  <TD><span className="text-xs font-semibold capitalize text-slate-700">{u.role}</span></TD>
                  <TD><StatusBadge status={u.accountStatus} /></TD>
                  <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(u.createdAt).format("D MMM YYYY")}</TD>
                </Row>
              ))}
            </TBody>
          </table>
        </div>
      )}

      {tab === "usage" && usage && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Workers", value: `${usage.workerSeats.active}`, limit: usage.workerSeats.unlimited ? null : usage.workerSeats.limit },
            { label: "Jobs this month", value: String(usage.jobsThisMonth) },
            { label: "Quotes this month", value: String(usage.quotesThisMonth) },
            { label: "Invoices this month", value: String(usage.invoicesThisMonth) },
          ].map((m) => (
            <div key={m.label} className="bg-white border border-[#E2E8F0] rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{m.value}</p>
              {m.limit != null && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Usage</span><span>{m.limit}</span></div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className="h-1.5 bg-[#1E3A5F] rounded-full" style={{ width: pct(parseInt(m.value), m.limit) }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "email" && emailSettings && (
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F8FAFC]">
            <div className="px-4 py-3"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Configuration</p></div>
            {[
              { label: "Sending mode", value: emailSettings.provider === "custom" ? "Custom domain" : "OnClockly default" },
              { label: "Sending domain", value: emailSettings.sendingDomain || "—" },
              { label: "Domain status", value: <StatusBadge status={emailSettings.domainStatus} /> },
              { label: "Sender email", value: emailSettings.senderEmail || "—" },
              { label: "Reply-to", value: emailSettings.replyToEmail || "—" },
              { label: "Last verified", value: emailSettings.lastVerificationCheckAt ? dayjs(emailSettings.lastVerificationCheckAt).format("D MMM YYYY, HH:mm") : "Never" },
            ].map((f) => (
              <div key={f.label} className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">{f.label}</span>
                <span className="text-xs font-semibold text-slate-700">{f.value}</span>
              </div>
            ))}
          </div>
          {emailSettings.provider === "custom" && (
            <div className="flex gap-2 flex-wrap">
              <button
                disabled={retryVerificationMutation.isPending}
                onClick={() => retryVerificationMutation.mutate()}
                className="h-8 px-3 text-xs font-semibold text-slate-700 bg-white border border-[#E2E8F0] rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={11} /> {retryVerificationMutation.isPending ? "Checking…" : "Retry verification"}
              </button>
              <button onClick={() => setResetDialog(true)} className="h-8 px-3 text-xs font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                Reset domain
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <THead>
              <TH>Timestamp</TH>
              <TH>Actor</TH>
              <TH>Action</TH>
              <TH>Result</TH>
            </THead>
            <TBody>
              {activity?.data.length === 0 && <EmptyRow colSpan={4}>No audit events found for this company.</EmptyRow>}
              {activity?.data.map((event) => (
                <Row key={event.id}>
                  <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(event.createdAt).format("D MMM, HH:mm")}</TD>
                  <TD className="text-xs font-semibold text-slate-700">{event.actorEmail}</TD>
                  <TD><code className="text-[11px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-600 font-mono">{event.action}</code></TD>
                  <TD>
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${event.result === "success" ? "text-emerald-700" : "text-red-700"}`}>
                      {event.result === "success" ? <Check size={10} /> : <XIcon size={10} />}
                      {event.result.charAt(0).toUpperCase() + event.result.slice(1)}
                    </span>
                  </TD>
                </Row>
              ))}
            </TBody>
          </table>
        </div>
      )}

      {statusDialog && (
        <ConfirmModal
          title={statusDialog === "active" ? `Restore ${company.name}?` : statusDialog === "suspended" ? `Suspend ${company.name}?` : `Disable ${company.name}?`}
          body={
            statusDialog === "active"
              ? "This will restore full access for this company's users."
              : "Users from this company will no longer be able to access OnClockly until the company is restored."
          }
          confirmLabel={statusDialog === "active" ? "Restore company" : statusDialog === "suspended" ? "Suspend company" : "Disable company"}
          danger={statusDialog !== "active"}
          busy={statusMutation.isPending}
          onConfirm={(reason) => statusMutation.mutate({ status: statusDialog, reason })}
          onClose={() => setStatusDialog(null)}
        />
      )}

      {planDialog && (
        <ConfirmModal
          title="Change company plan"
          body={`Current plan: ${company.plan}. This is a manual override — there is no billing provider behind this change yet.`}
          confirmLabel="Change plan"
          busy={planMutation.isPending}
          onConfirm={(reason) => planMutation.mutate({ plan, reason })}
          onClose={() => setPlanDialog(false)}
        >
          <div className="mb-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">New plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </ConfirmModal>
      )}

      {resetDialog && (
        <ConfirmModal
          title="Reset sending domain?"
          body="This clears the custom sending domain configuration. Email sending falls back to the OnClockly default sender immediately."
          confirmLabel="Reset domain"
          danger
          busy={resetDomainMutation.isPending}
          onConfirm={(reason) => resetDomainMutation.mutate(reason)}
          onClose={() => setResetDialog(false)}
        />
      )}
    </div>
  );
}
