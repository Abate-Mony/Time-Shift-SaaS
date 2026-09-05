import { DataRow, SectionCard, SectionLabel } from "@/components/SectionUi";
import { Mail, MapPin, Phone, User } from "lucide-react";
import { useClientDetail } from "./ClientDetailContext";

export function ClientDetailsOverviewPage() {
    const { client, stats } = useClientDetail();
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary contact */}
            {client.primaryContact && (
                <SectionCard>
                    <SectionLabel>Primary contact</SectionLabel>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                            <User size={15} className="text-[#1E3A5F]" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{client.primaryContact.name}</p>
                            {client.primaryContact.role && <p className="text-xs text-slate-500">{client.primaryContact.role}</p>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {client.primaryContact.email && (
                            <a href={`mailto:${client.primaryContact.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors min-w-0">
                                <Mail size={12} className="shrink-0 text-slate-400" />
                                <span className="truncate">{client.primaryContact.email}</span>
                            </a>
                        )}
                        {client.primaryContact.phone && (
                            <span className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                                <Phone size={12} className="shrink-0 text-slate-400" />
                                {client.primaryContact.phone}
                            </span>
                        )}
                    </div>
                </SectionCard>
            )}

            {/* Address */}
            <SectionCard>
                <SectionLabel>Address</SectionLabel>
                {client.formattedAddress ? (
                    <div className="flex items-start gap-2 text-sm text-slate-700">
                        <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" />
                        <span className="leading-relaxed">{client.formattedAddress}</span>
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 italic">No address on file</p>
                )}
                {client.phone && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                        <Phone size={12} className="shrink-0 text-slate-400" />
                        {client.phone}
                    </div>
                )}
            </SectionCard>

            {/* Default charges */}
            <SectionCard>
                <SectionLabel>Default charge settings</SectionLabel>
                <div className="divide-y divide-slate-100">
                    <DataRow label="Charge type" value={client.defaultChargeType === 'hourly' ? 'Hourly' : 'Fixed'} />
                    <DataRow
                        label="Default rate"
                        value={client.defaultChargeType === 'hourly'
                            ? `£${client.defaultChargeRate.toFixed(2)} / hour`
                            : `£${client.defaultChargeRate.toFixed(2)} fixed`}
                    />
                    <DataRow label="Payment terms" value={`${client.paymentTermsDays} days`} />
                    {client.vatNumber && <DataRow label="VAT number" value={client.vatNumber} />}
                </div>
            </SectionCard>

            {/* Activity */}
            <SectionCard>
                <SectionLabel>Activity</SectionLabel>
                <div className="divide-y divide-slate-100">
                    <DataRow label="Total jobs" value={String(stats.totalJobs)} />
                    <DataRow label="Upcoming jobs" value={String(stats.upcomingJobs)} />
                    <DataRow label="Total invoiced" value={`£${stats.totalInvoiced.toFixed(2)}`} />
                    <DataRow label="Outstanding balance" value={`£${stats.outstandingBalance.toFixed(2)}`} />
                    <DataRow label="Client since" value={new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                    <DataRow label="Last updated" value={new Date(client.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                </div>
            </SectionCard>

            {/* Notes */}
            {client.notes && (
                <SectionCard className="md:col-span-2">
                    <SectionLabel>Internal notes</SectionLabel>
                    <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
                </SectionCard>
            )}
        </div>
    )
}