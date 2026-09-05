import { DataRow, SectionCard, SectionLabel } from "@/components/SectionUi";
import { useClientDetail } from "./ClientDetailContext";

export default function ClentBillingPage() {
    const { client } = useClientDetail();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard>
                <SectionLabel>Billing details</SectionLabel>
                <div className="divide-y divide-slate-100">
                    <DataRow label="Billing email" value={client.billingEmail} />
                    <DataRow label="VAT number" value={client.vatNumber} />
                    <DataRow label="Payment terms" value={`${client.paymentTermsDays} days`} />
                </div>
            </SectionCard>
            <SectionCard>
                <SectionLabel>Default charge</SectionLabel>
                <div className="divide-y divide-slate-100">
                    <DataRow label="Charge type" value={client.defaultChargeType === 'hourly' ? 'Hourly rate' : 'Fixed price'} />
                    <DataRow
                        label="Rate"
                        value={client.defaultChargeType === 'hourly'
                            ? `£${client.defaultChargeRate.toFixed(2)} / hour`
                            : `£${client.defaultChargeRate.toFixed(2)}`}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    These values prefill new jobs for this client. Managers can override per job.
                </p>
            </SectionCard>
        </div>
    )
}
