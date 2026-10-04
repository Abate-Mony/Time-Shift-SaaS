import { CreditCard, Ban } from "lucide-react";
import toast from "react-hot-toast";
import { MetricCard, StatusBadge, TH, TD, PlatformTable, THead, TBody, Row, RowMenu } from "@/components/platform/figma/primitives";
import { PlatformPreviewBanner } from "@/components/platform/PlatformPreviewBanner";

// No billing provider is wired up yet — see PlatformOverview's own comment
// on why MRR/subscriptions are left out of the real overview endpoint.
// Ported directly from the Figma source's SUBSCRIPTIONS/SubscriptionsScreen.
const SUBSCRIPTIONS = [
  { id: "s1", company: "SecureGuard UK", plan: "Enterprise", billing: "annual", status: "active", workers: 142, workerLimit: 200, renewal: "15 Jan 2027", mrr: 499 },
  { id: "s2", company: "PremiumFM Group", plan: "Enterprise", billing: "annual", status: "active", workers: 198, workerLimit: 200, renewal: "3 Mar 2027", mrr: 499 },
  { id: "s3", company: "Acme Cleaning Ltd", plan: "Professional", billing: "monthly", status: "active", workers: 43, workerLimit: 50, renewal: "12 Oct 2026", mrr: 149 },
  { id: "s4", company: "BrightCare Support Ltd", plan: "Professional", billing: "monthly", status: "suspended", workers: 28, workerLimit: 50, renewal: "3 Oct 2026", mrr: 149 },
  { id: "s5", company: "EventPro Staffing", plan: "Professional", billing: "monthly", status: "active", workers: 37, workerLimit: 50, renewal: "1 Oct 2026", mrr: 149 },
  { id: "s6", company: "SwiftEvent Services", plan: "Professional", billing: "monthly", status: "active", workers: 22, workerLimit: 50, renewal: "25 Sep 2026", mrr: 149 },
  { id: "s7", company: "CleanCo Services", plan: "Starter", billing: "monthly", status: "active", workers: 11, workerLimit: 15, renewal: "28 Oct 2026", mrr: 59 },
] as const;

const fmtMrr = (v: number) => (v === 0 ? "—" : `£${v.toLocaleString()}`);
const notAvailable = () => toast("This is a design preview — not wired to a billing provider yet.");

export function PlatformSubscriptions() {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Understand subscription health across OnClockly.</p>
      </div>

      <PlatformPreviewBanner reason="There's no billing provider connected yet, so plan/MRR/renewal data below is illustrative, not live." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Active subscriptions" value="834" trend="up" trendLabel="+12 this month" />
        <MetricCard label="MRR" value="£42,680" trend="up" trendLabel="+8.4%" />
        <MetricCard label="Past due" value="2" danger />
        <MetricCard label="Cancelled this month" value="3" trend="down" trendLabel="vs 5 last month" />
      </div>

      <PlatformTable>
        <THead>
          <TH>Company</TH>
          <TH>Plan</TH>
          <TH>Billing</TH>
          <TH>Status</TH>
          <TH>Workers</TH>
          <TH>Renewal</TH>
          <TH>MRR</TH>
          <TH><span className="sr-only">Actions</span></TH>
        </THead>
        <TBody>
          {SUBSCRIPTIONS.map((s) => (
            <Row key={s.id}>
              <TD><p className="font-semibold text-slate-800 text-sm">{s.company}</p></TD>
              <TD><span className="text-xs font-semibold text-slate-700">{s.plan}</span></TD>
              <TD><span className="text-xs capitalize text-slate-500">{s.billing}</span></TD>
              <TD><StatusBadge status={s.status} /></TD>
              <TD><span className="text-sm font-semibold text-slate-800">{s.workers}</span><span className="text-xs text-slate-400"> / {s.workerLimit}</span></TD>
              <TD className="text-xs text-slate-400 whitespace-nowrap">{s.renewal}</TD>
              <TD className="text-xs font-bold text-slate-700">{fmtMrr(s.mrr)}</TD>
              <TD>
                <RowMenu
                  items={[
                    { label: "Change plan", icon: CreditCard, onClick: notAvailable },
                    { label: "Cancel subscription", icon: Ban, danger: true, onClick: notAvailable },
                  ]}
                />
              </TD>
            </Row>
          ))}
        </TBody>
      </PlatformTable>
    </div>
  );
}
