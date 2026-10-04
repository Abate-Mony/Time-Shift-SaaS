import { Globe, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { DomainBadge, TH, TD, THead, TBody, Row, RowMenu } from "@/components/platform/figma/primitives";
import { PlatformPreviewBanner } from "@/components/platform/PlatformPreviewBanner";

// The per-company sending domain is real (see Company Detail's Email tab,
// backed by platformCompanyEmailQuery / retryEmailDomainVerification /
// resetEmailDomain). There is no endpoint that rolls that up *across*
// every company yet, so this cross-company view is mock data, ported
// directly from the Figma source's EMAIL_DOMAINS/EmailScreen.
const EMAIL_DOMAINS = [
  { id: "d1", company: "SecureGuard UK", domain: "mail.secureguard.co.uk", status: "verified", sender: "ops@secureguard.co.uk", verifiedAt: "15 Jan 2026", lastChecked: "2 min ago" },
  { id: "d2", company: "Acme Cleaning Ltd", domain: "mail.acme.co.uk", status: "verified", sender: "jobs@acme.co.uk", verifiedAt: "12 Aug 2026", lastChecked: "5 min ago" },
  { id: "d3", company: "BrightCare Support Ltd", domain: "mail.brightcare.com", status: "failed", sender: "hello@brightcare.com", verifiedAt: "—", lastChecked: "1 hr ago" },
  { id: "d4", company: "EventPro Staffing", domain: "notify.eventpro.co.uk", status: "pending", sender: "team@eventpro.co.uk", verifiedAt: "—", lastChecked: "30 min ago" },
  { id: "d5", company: "PremiumFM Group", domain: "mail.premiumfm.co.uk", status: "verified", sender: "admin@premiumfm.co.uk", verifiedAt: "3 Mar 2026", lastChecked: "10 min ago" },
] as const;

const notAvailable = () => toast("This is a design preview — manage a company's real domain from its own Email tab.");

const METRICS: Array<{ label: string; value: string; danger?: boolean }> = [
  { label: "Sent today", value: "841" },
  { label: "Delivery rate", value: "98.4%" },
  { label: "Failed today", value: "13", danger: true },
  { label: "Domains verified", value: "3" },
  { label: "Pending", value: "1" },
  { label: "Failed", value: "1", danger: true },
];

export function PlatformEmails() {
  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Email Operations</h1>
        <p className="text-sm text-slate-500 mt-0.5">Email delivery and sending domain status across all companies.</p>
      </div>

      <PlatformPreviewBanner reason="There's no cross-company rollup endpoint yet — per-company domain status is real on each company's Email tab, but this aggregate view is mock data." />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {METRICS.map((m) => (
          <div key={m.label} className={`bg-white border rounded-lg p-4 ${m.danger ? "border-red-200 bg-red-50/40" : "border-[#E2E8F0]"}`}>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${m.danger ? "text-red-700" : "text-slate-900"}`}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-800">Custom Sending Domains</h3>
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
            {EMAIL_DOMAINS.map((d) => (
              <Row key={d.id}>
                <TD className="font-semibold text-slate-800 text-sm">{d.company}</TD>
                <TD><code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded">{d.domain}</code></TD>
                <TD><DomainBadge status={d.status} /></TD>
                <TD className="text-xs text-slate-500">{d.sender}</TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{d.verifiedAt}</TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{d.lastChecked}</TD>
                <TD>
                  <RowMenu
                    items={[
                      { label: "View DNS records", icon: Globe, onClick: notAvailable },
                      { label: "Retry verification", icon: RefreshCw, onClick: notAvailable },
                      { label: "Reset domain", icon: Trash2, danger: true, onClick: notAvailable },
                    ]}
                  />
                </TD>
              </Row>
            ))}
          </TBody>
        </table>
      </div>
    </div>
  );
}
