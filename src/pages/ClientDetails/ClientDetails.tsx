import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft, Pencil,
    Archive, RefreshCw, Trash2, Plus, Briefcase, MapPin, AlertTriangle,
    User, MoreHorizontal,
} from 'lucide-react'
import { DialogBackdrop, ClientStatusBadge, type ClientFormData } from '../Clients'
import { Link, NavLink, Outlet, useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { clientDetailQuery } from '@/utils/clients'
import type { Client } from '@/utils/types/client'
import { ClientDetailProvider } from './ClientDetailContext'

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(clientDetailQuery(params.id as string))
    return null
}

// Same shape as Clients.tsx's create/edit payload builder — only `name` is
// required server-side, unknown keys are rejected, untouched optional
// fields must be omitted rather than sent empty.
const buildClientPayload = (data: ClientFormData) => ({
    name: data.name.trim(),
    contacts: data.contactName.trim() ? [{
        name: data.contactName.trim(),
        role: data.contactRole.trim() || undefined,
        email: data.contactEmail.trim() || undefined,
        phone: data.contactPhone.trim() || undefined,
        isPrimary: true,
    }] : [],
    phone: data.phone.trim() || undefined,
    billingEmail: data.billingEmail.trim() || undefined,
    vatNumber: data.vatNumber.trim() || undefined,
    address: (data.addressLine1 || data.city || data.postcode) ? {
        line1: data.addressLine1.trim() || undefined,
        city: data.city.trim() || undefined,
        postcode: data.postcode.trim() || undefined,
    } : undefined,
    defaultChargeType: data.defaultChargeType,
    defaultChargeRate: data.defaultChargeRate ? parseFloat(data.defaultChargeRate) : undefined,
    paymentTermsDays: data.paymentTermsDays ? parseInt(data.paymentTermsDays, 10) : undefined,
    notes: data.notes.trim() || undefined,
})



// ─── Tab bar ──────────────────────────────────────────────────────────────────
// NavLink derives the active tab from the real URL — survives a refresh or
// a direct link to e.g. clients/:id/billing, unlike tracking it in local
// state that only updates on click.

const TABS: { to: string; label: string }[] = [
    { to: 'overview', label: 'Overview' },
    { to: 'contacts', label: 'Contacts' },
    { to: 'jobs', label: 'Jobs' },
    { to: 'billing', label: 'Billing' },
]

function TabBar() {
    return (
        <div className="flex items-center gap-0 border-b border-[#E2E8F0] mb-5">
            {TABS.map(t => (
                <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) => `px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${isActive
                        ? 'border-[#1E3A5F] text-[#1E3A5F]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    {t.label}
                </NavLink>
            ))}
        </div>
    )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

// function OverviewTab({ client }: { client: Client }) {
//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Primary contact */}
//             {client.primaryContact && (
//                 <SectionCard>
//                     <SectionLabel>Primary contact</SectionLabel>
//                     <div className="flex items-center gap-3 mb-3">
//                         <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
//                             <User size={15} className="text-[#1E3A5F]" />
//                         </div>
//                         <div className="min-w-0">
//                             <p className="text-sm font-bold text-slate-900 truncate">{client.primaryContact.name}</p>
//                             {client.primaryContact.role && <p className="text-xs text-slate-500">{client.primaryContact.role}</p>}
//                         </div>
//                     </div>
//                     <div className="flex flex-col gap-1.5">
//                         {client.primaryContact.email && (
//                             <a href={`mailto:${client.primaryContact.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors min-w-0">
//                                 <Mail size={12} className="shrink-0 text-slate-400" />
//                                 <span className="truncate">{client.primaryContact.email}</span>
//                             </a>
//                         )}
//                         {client.primaryContact.phone && (
//                             <span className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
//                                 <Phone size={12} className="shrink-0 text-slate-400" />
//                                 {client.primaryContact.phone}
//                             </span>
//                         )}
//                     </div>
//                 </SectionCard>
//             )}

//             {/* Address */}
//             <SectionCard>
//                 <SectionLabel>Address</SectionLabel>
//                 {client.formattedAddress ? (
//                     <div className="flex items-start gap-2 text-sm text-slate-700">
//                         <MapPin size={14} className="shrink-0 text-slate-400 mt-0.5" />
//                         <span className="leading-relaxed">{client.formattedAddress}</span>
//                     </div>
//                 ) : (
//                     <p className="text-sm text-slate-400 italic">No address on file</p>
//                 )}
//                 {client.phone && (
//                     <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
//                         <Phone size={12} className="shrink-0 text-slate-400" />
//                         {client.phone}
//                     </div>
//                 )}
//             </SectionCard>

//             {/* Default charges */}
//             <SectionCard>
//                 <SectionLabel>Default charge settings</SectionLabel>
//                 <div className="divide-y divide-slate-100">
//                     <DataRow label="Charge type" value={client.defaultChargeType === 'hourly' ? 'Hourly' : 'Fixed'} />
//                     <DataRow
//                         label="Default rate"
//                         value={client.defaultChargeType === 'hourly'
//                             ? `£${client.defaultChargeRate.toFixed(2)} / hour`
//                             : `£${client.defaultChargeRate.toFixed(2)} fixed`}
//                     />
//                     <DataRow label="Payment terms" value={`${client.paymentTermsDays} days`} />
//                     {client.vatNumber && <DataRow label="VAT number" value={client.vatNumber} />}
//                 </div>
//             </SectionCard>

//             {/* Activity */}
//             <SectionCard>
//                 <SectionLabel>Activity</SectionLabel>
//                 <div className="divide-y divide-slate-100">
//                     <DataRow label="Total jobs" value={String(client.jobCount ?? 0)} />
//                     <DataRow label="Active jobs" value={String(client.activeJobCount ?? 0)} />
//                     <DataRow label="Client since" value={new Date(client.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
//                     <DataRow label="Last updated" value={new Date(client.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
//                 </div>
//             </SectionCard>

//             {/* Notes */}
//             {client.notes && (
//                 <SectionCard className="md:col-span-2">
//                     <SectionLabel>Internal notes</SectionLabel>
//                     <p className="text-sm text-slate-600 leading-relaxed">{client.notes}</p>
//                 </SectionCard>
//             )}
//         </div>
//     )
// }

// // ─── Contacts tab ─────────────────────────────────────────────────────────────

// function ContactsTab({ client }: { client: Client }) {
//     if (client.contacts.length === 0) {
//         return (
//             <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-14 text-center">
//                 <User size={22} className="text-slate-300 mb-3" />
//                 <p className="text-sm font-semibold text-slate-500">No contacts yet</p>
//                 <p className="text-xs text-slate-400 mt-1">Add contacts when editing this client.</p>
//             </div>
//         )
//     }
//     return (
//         <div className="flex flex-col gap-3">
//             {client.contacts.map((c, i) => (
//                 <SectionCard key={i}>
//                     <div className="flex items-start gap-3">
//                         <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
//                             <User size={15} className="text-[#1E3A5F]" />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-2 flex-wrap mb-0.5">
//                                 <span className="text-sm font-bold text-slate-900">{c.name}</span>
//                                 {c.isPrimary && (
//                                     <span className="text-[10px] font-semibold bg-[#1E3A5F]/8 text-[#1E3A5F] px-2 py-0.5 rounded-full">Primary</span>
//                                 )}
//                             </div>
//                             {c.role && <p className="text-xs text-slate-500 mb-2">{c.role}</p>}
//                             <div className="flex flex-col gap-1">
//                                 {c.email && (
//                                     <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors">
//                                         <Mail size={11} className="shrink-0 text-slate-400" />
//                                         {c.email}
//                                     </a>
//                                 )}
//                                 {c.phone && (
//                                     <span className="flex items-center gap-2 text-xs text-slate-600">
//                                         <Phone size={11} className="shrink-0 text-slate-400" />
//                                         {c.phone}
//                                     </span>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </SectionCard>
//             ))}
//         </div>
//     )
// }

// // ─── Jobs tab ─────────────────────────────────────────────────────────────────

// function JobsTab({ client, onJobNavigate }: { client: Client; onJobNavigate: (jobId: string) => void }) {
//     const [jobFilter, setJobFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
//     const jobs = CLIENT_JOBS[client._id] ?? []
//     const filtered = jobs.filter(j => {
//         if (jobFilter === 'upcoming') return j.status === 'upcoming'
//         if (jobFilter === 'past') return j.status !== 'upcoming'
//         return true
//     })

//     return (
//         <div>
//             <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
//                 <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
//                     {(['upcoming', 'past', 'all'] as const).map(f => (
//                         <button key={f} onClick={() => setJobFilter(f)}
//                             className={`h-7 px-3 rounded-lg text-xs font-semibold capitalize transition-all ${jobFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
//                                 }`}>
//                             {f === 'all' ? `All (${jobs.length})` : f === 'upcoming' ? `Upcoming (${jobs.filter(j => j.status === 'upcoming').length})` : `Past (${jobs.filter(j => j.status !== 'upcoming').length})`}
//                         </button>
//                     ))}
//                 </div>
//                 <button
//                     onClick={() => onJobNavigate('create-job')}
//                     className="h-8 px-3.5 bg-[#1E3A5F] text-white text-xs font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-1.5"
//                 >
//                     <Plus size={12} /> Create job
//                 </button>
//             </div>

//             {filtered.length === 0 ? (
//                 <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-12 text-center">
//                     <Briefcase size={20} className="text-slate-300 mb-2" />
//                     <p className="text-sm text-slate-500">No {jobFilter} jobs for this client</p>
//                 </div>
//             ) : (
//                 <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
//                     {filtered.map((job, i) => (
//                         <button
//                             key={job._id}
//                             onClick={() => onJobNavigate(job._id)}
//                             className={`w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}
//                         >
//                             <div className="flex-1 min-w-0">
//                                 <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
//                                 <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
//                                     <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDate(job.date)}</span>
//                                     <span>{job.time}</span>
//                                     <span className="flex items-center gap-1 min-w-0"><MapPin size={10} className="shrink-0" /><span className="truncate">{job.location}</span></span>
//                                 </div>
//                             </div>
//                             <div className="flex items-center gap-2 shrink-0">
//                                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${jobStatusStyle(job.status)}`}>
//                                     {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
//                                 </span>
//                                 <ExternalLink size={12} className="text-slate-300" />
//                             </div>
//                         </button>
//                     ))}
//                 </div>
//             )}
//         </div>
//     )
// }

// // ─── Billing tab ──────────────────────────────────────────────────────────────

// function BillingTab({ client }: { client: Client }) {
//     return (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <SectionCard>
//                 <SectionLabel>Billing details</SectionLabel>
//                 <div className="divide-y divide-slate-100">
//                     <DataRow label="Billing email" value={client.billingEmail} />
//                     <DataRow label="VAT number" value={client.vatNumber} />
//                     <DataRow label="Payment terms" value={`${client.paymentTermsDays} days`} />
//                 </div>
//             </SectionCard>
//             <SectionCard>
//                 <SectionLabel>Default charge</SectionLabel>
//                 <div className="divide-y divide-slate-100">
//                     <DataRow label="Charge type" value={client.defaultChargeType === 'hourly' ? 'Hourly rate' : 'Fixed price'} />
//                     <DataRow
//                         label="Rate"
//                         value={client.defaultChargeType === 'hourly'
//                             ? `£${client.defaultChargeRate.toFixed(2)} / hour`
//                             : `£${client.defaultChargeRate.toFixed(2)}`}
//                     />
//                 </div>
//                 <p className="text-xs text-slate-400 mt-3 leading-relaxed">
//                     These values prefill new jobs for this client. Managers can override per job.
//                 </p>
//             </SectionCard>
//         </div>
//     )
// }

// ─── Client form (inline re-import workaround) ────────────────────────────────

function FormInput({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string; type?: string
}) {
    return (
        <div>
            <label className="block text-[11px] text-slate-500 mb-1">{label}</label>
            <input value={value} onChange={onChange} placeholder={placeholder} type={type}
                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
        </div>
    )
}

function EditClientForm({ client, onSave, onClose }: { client: Client; onSave: (data: ClientFormData) => void; onClose: () => void }) {
    const [form, setForm] = useState<ClientFormData>({
        name: client.name,
        contactName: client.primaryContact?.name ?? '',
        contactRole: client.primaryContact?.role ?? '',
        contactEmail: client.primaryContact?.email ?? '',
        contactPhone: client.primaryContact?.phone ?? '',
        phone: client.phone ?? '',
        billingEmail: client.billingEmail ?? '',
        vatNumber: client.vatNumber ?? '',
        addressLine1: client.address?.line1 ?? '',
        city: client.address?.city ?? '',
        postcode: client.address?.postcode ?? '',
        defaultChargeType: client.defaultChargeType,
        defaultChargeRate: String(client.defaultChargeRate),
        paymentTermsDays: String(client.paymentTermsDays),
        notes: client.notes ?? '',
    })
    const [showBilling, setShowBilling] = useState(false)
    const set = (k: keyof ClientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }))

    const handleSave = () => onSave(form)

    return (
        <DialogBackdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] shrink-0">
                    <h2 className="text-base font-bold text-slate-900">Edit client</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <span className="text-lg leading-none">×</span>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Client name <span className="text-red-400">*</span></label>
                        <input value={form.name} onChange={set('name')} placeholder="Client name"
                            className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Primary contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Name" value={form.contactName} onChange={set('contactName')} placeholder="Sarah Williams" />
                            <FormInput label="Role" value={form.contactRole} onChange={set('contactRole')} placeholder="Facilities Manager" />
                            <FormInput label="Email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="sarah@client.co.uk" type="email" />
                            <FormInput label="Phone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="07700 900123" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Office phone" value={form.phone} onChange={set('phone')} placeholder="020 7946 0001" />
                        <FormInput label="Billing email" value={form.billingEmail} onChange={set('billingEmail')} placeholder="accounts@client.co.uk" type="email" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Default charges</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] text-slate-500 mb-1">Charge type</label>
                                <select value={form.defaultChargeType} onChange={set('defaultChargeType')}
                                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all">
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <FormInput label={form.defaultChargeType === 'hourly' ? 'Rate (£/hr)' : 'Fixed (£)'} value={form.defaultChargeRate} onChange={set('defaultChargeRate')} type="number" />
                        </div>
                        <div className="mt-3">
                            <FormInput label="Payment terms (days)" value={form.paymentTermsDays} onChange={set('paymentTermsDays')} type="number" />
                        </div>
                    </div>
                    <button type="button" onClick={() => setShowBilling(b => !b)}
                        className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5 hover:opacity-75 transition-opacity">
                        <span className="text-base leading-none">{showBilling ? '−' : '+'}</span>
                        {showBilling ? 'Hide' : 'Edit'} address &amp; VAT
                    </button>
                    <AnimatePresence>
                        {showBilling && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
                                <div className="flex flex-col gap-3 pt-1">
                                    <FormInput label="Address line 1" value={form.addressLine1} onChange={set('addressLine1')} placeholder="14 Canary Wharf" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormInput label="City" value={form.city} onChange={set('city')} placeholder="London" />
                                        <FormInput label="Postcode" value={form.postcode} onChange={set('postcode')} placeholder="E14 5AB" />
                                    </div>
                                    <FormInput label="VAT number" value={form.vatNumber} onChange={set('vatNumber')} placeholder="GB123456789" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal notes</label>
                        <textarea value={form.notes} onChange={set('notes')} rows={2}
                            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all resize-none" />
                    </div>
                </div>
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5 shrink-0">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button onClick={handleSave} className="h-9 px-5 text-sm font-bold rounded-xl bg-[#1E3A5F] text-white hover:bg-[#162D4A] transition-colors">Save changes</button>
                </div>
            </div>
        </DialogBackdrop>
    )
}

// ─── Status / Delete dialogs ──────────────────────────────────────────────────

function StatusDialog({ client, onConfirm, onClose }: { client: Client; onConfirm: () => void; onClose: () => void }) {
    const isActive = client.status === 'active'
    return (
        <DialogBackdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${isActive ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                        {isActive ? <Archive size={18} className="text-amber-600" /> : <RefreshCw size={18} className="text-emerald-600" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                        {isActive ? `Mark ${client.name} as inactive?` : 'Reactivate client'}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        {isActive
                            ? 'Existing jobs, invoices and history will remain. You can reactivate this client later.'
                            : `${client.name} will be restored to active status.`}
                    </p>
                </div>
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className={`h-9 px-5 text-sm font-bold rounded-xl transition-colors ${isActive ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                        {isActive ? 'Mark inactive' : 'Reactivate client'}
                    </button>
                </div>
            </div>
        </DialogBackdrop>
    )
}

function DeleteDialog({ client, blockedMessage, onConfirm, onMarkInactive, onClose }: { client: Client; blockedMessage: string | null; onConfirm: () => void; onMarkInactive: () => void; onClose: () => void }) {
    const blocked = !!blockedMessage
    return (
        <DialogBackdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
                <div className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                        {blocked ? <AlertTriangle size={18} className="text-red-500" /> : <Trash2 size={18} className="text-red-500" />}
                    </div>
                    {blocked ? (
                        <>
                            <h3 className="text-base font-bold text-slate-900 mb-2">Client can't be deleted</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{blockedMessage}</p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-base font-bold text-slate-900 mb-2">Delete {client.name}?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-2">This client will be removed from active client lists. Existing historical jobs and invoices will remain intact.</p>
                            <p className="text-sm text-slate-500 leading-relaxed">If you simply no longer work with this client, mark them inactive instead.</p>
                        </>
                    )}
                </div>
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5">
                    {blocked ? (
                        <>
                            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Close</button>
                            <button onClick={onMarkInactive} className="h-9 px-5 text-sm font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors">Mark inactive</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                            <button onClick={onConfirm} className="h-9 px-5 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors">Delete client</button>
                        </>
                    )}
                </div>
            </div>
        </DialogBackdrop>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message }: { message: string }) {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg">
            {message}
        </motion.div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ClientDetail() {
    const { id } = useParams<{ id: string }>()
    const { client, stats, recentJobs } = useQuery(clientDetailQuery(id as string)).data as {
        client: Client
        stats: import('@/utils/clients').ClientStats
        recentJobs: import('@/utils/clients').ClientRecentJob[]
    }
    const [showEdit, setShowEdit] = useState(false)
    const [showStatus, setShowStatus] = useState(false)
    const [showDelete, setShowDelete] = useState(false)
    const [deleteBlockedMsg, setDeleteBlockedMsg] = useState<string | null>(null)
    const [moreOpen, setMoreOpen] = useState(false)

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['client', id] })

    const handleSaveEdit = async (data: ClientFormData) => {
        try {
            await customFetch.patch(`/clients/${client._id}`, buildClientPayload(data))
            invalidate()
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success('Client updated.')
            setShowEdit(false)
        } catch (err: any) {
            toast.error(err.response?.data?.msg ?? 'Failed to save client.')
        }
    }

    const handleStatusChange = async () => {
        const nextStatus = client.status === 'active' ? 'inactive' : 'active'
        try {
            await customFetch.patch(`/clients/${client._id}/status`, { status: nextStatus })
            invalidate()
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success(nextStatus === 'inactive' ? `${client.name} marked inactive.` : 'Client reactivated.')
            setShowStatus(false)
        } catch (err: any) {
            toast.error(err.response?.data?.msg ?? 'Failed to update status.')
        }
    }

    const handleDelete = async () => {
        try {
            await customFetch.delete(`/clients/${client._id}`)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success(`${client.name} deleted.`)
            setShowDelete(false)
            onNavigate('/clients')
        } catch (err: any) {
            const msg = err.response?.data?.msg
            if (err.response?.status === 400 && msg) {
                setDeleteBlockedMsg(msg)
            } else {
                toast.error(msg ?? 'Failed to delete client.')
            }
        }
    }

    const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('')
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    return (
        <div className="p-6 max-w-8xl">
            {/* Back */}
            <Link to={"/clients"} onClick={() => onNavigate('clients')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5">
                <ChevronLeft size={14} /> Back to Clients
            </Link>

            {/* Header */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-5">
                <div className="flex items-start gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-[#1E3A5F]">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap mb-1">
                            <h1 className="text-lg font-bold text-slate-900 truncate">{client.name}</h1>
                            <ClientStatusBadge status={client.status} />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                            {client.primaryContact?.name && (
                                <span className="flex items-center gap-1"><User size={10} className="text-slate-400" />{client.primaryContact.name}</span>
                            )}
                            {client.formattedAddress && (
                                <span className="flex items-center gap-1"><MapPin size={10} className="text-slate-400" />{client.formattedAddress}</span>
                            )}
                            <span className="flex items-center gap-1"><Briefcase size={10} className="text-slate-400" />{stats.totalJobs} jobs</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => onNavigate('create-job')}
                            className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-1.5"
                        >
                            <Plus size={13} /> Create job
                        </button>
                        <div className="relative">
                            <button onClick={() => setMoreOpen(o => !o)} className="h-9 w-9 flex items-center justify-center border border-[#E2E8F0] rounded-xl hover:bg-slate-50 text-slate-500 transition-colors">
                                <MoreHorizontal size={16} />
                            </button>
                            <AnimatePresence>
                                {moreOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                            transition={{ duration: 0.1 }}
                                            className="absolute right-0 top-10 z-20 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1"
                                        >
                                            <button onClick={() => { setMoreOpen(false); setShowEdit(true) }}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                <Pencil size={13} /> Edit client
                                            </button>
                                            {client.status === 'active' ? (
                                                <button onClick={() => { setMoreOpen(false); setShowStatus(true) }}
                                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <Archive size={13} /> Mark inactive
                                                </button>
                                            ) : (
                                                <button onClick={() => { setMoreOpen(false); setShowStatus(true) }}
                                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <RefreshCw size={13} /> Reactivate
                                                </button>
                                            )}
                                            <div className="border-t border-slate-100 my-1" />
                                            <button onClick={() => { setMoreOpen(false); setShowDelete(true) }}
                                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                <Trash2 size={13} /> Delete client
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <TabBar />

            <ClientDetailProvider value={{ client, stats, recentJobs }}>
                <AnimatePresence mode="wait">
                    <Outlet />
                </AnimatePresence>
            </ClientDetailProvider>

            {/* Dialogs */}
            <AnimatePresence>
                {showEdit && <EditClientForm client={client} onSave={handleSaveEdit} onClose={() => setShowEdit(false)} />}
                {showStatus && (
                    <StatusDialog
                        client={client}
                        onConfirm={handleStatusChange}
                        onClose={() => setShowStatus(false)}
                    />
                )}
                {showDelete && (
                    <DeleteDialog
                        client={client}
                        blockedMessage={deleteBlockedMsg}
                        onConfirm={handleDelete}
                        onMarkInactive={() => { setShowDelete(false); setDeleteBlockedMsg(null); setShowStatus(true) }}
                        onClose={() => { setShowDelete(false); setDeleteBlockedMsg(null) }}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}
