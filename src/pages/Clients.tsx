import { Button } from '@/components/ui/button'
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertTriangle,
    Archive,
    Building2,
    Mail,
    MapPin,
    MoreHorizontal,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { clientsQuery } from '@/utils/clients'
import type { Client, ClientStatus } from '@/utils/types/client'

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(clientsQuery())
    return null
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'active' | 'inactive'

// ─── Status badge ─────────────────────────────────────────────────────────────

function ClientStatusBadge({ status }: { status: ClientStatus }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
            {status === 'active' ? 'Active' : 'Inactive'}
        </span>
    )
}

// ─── Actions menu ─────────────────────────────────────────────────────────────

function ClientActionsMenu({
    client,
    onEdit,
    onStatusChange,
    onDelete,
}: {
    client: Client
    onEdit: () => void
    onStatusChange: () => void
    onDelete: () => void
}) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative" onClick={e => e.stopPropagation()}>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
                <MoreHorizontal size={15} />
            </button>
            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-9 z-20 w-48 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 overflow-hidden"
                        >
                            <MenuItem icon={Pencil} label="Edit client" onClick={() => { setOpen(false); onEdit() }} />
                            {client.status === 'active' ? (
                                <MenuItem icon={Archive} label="Mark inactive" onClick={() => { setOpen(false); onStatusChange() }} />
                            ) : (
                                <MenuItem icon={RefreshCw} label="Reactivate" onClick={() => { setOpen(false); onStatusChange() }} />
                            )}
                            <div className="border-t border-slate-100 my-1" />
                            <MenuItem icon={Trash2} label="Delete client" onClick={() => { setOpen(false); onDelete() }} danger />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.FC<{ size?: number; className?: string }>; label: string; onClick: () => void; danger?: boolean }) {
    return (
        <Button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'
                }`}
        >
            <Icon size={13} className="shrink-0" />
            {label}
        </Button>
    )
}

// ─── Client card (mobile) ─────────────────────────────────────────────────────

function ClientCard({
    client,
    onClick,
    onEdit,
    onStatusChange,
    onDelete,
}: {
    client: Client
    onClick: () => void
    onEdit: () => void
    onStatusChange: () => void
    onDelete: () => void
}) {
    const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('')
    return (
        <motion.div
            whileHover={{ y: -1 }}
            transition={{ duration: 0.12 }}
            className="bg-white border border-[#E2E8F0] rounded-xl p-4 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-[#1E3A5F]">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-slate-900 min-w-0 truncate">{client.name}</span>
                        <ClientStatusBadge status={client.status} />
                    </div>
                    {client.primaryContact?.name && (
                        <p className="text-xs text-slate-500 truncate">{client.primaryContact.name}</p>
                    )}
                    {client.formattedAddress && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 min-w-0 truncate">
                            <MapPin size={10} className="shrink-0" />
                            {client.formattedAddress}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500"><span className="font-semibold text-slate-700">{client.jobCount ?? 0}</span> jobs</span>
                        <span className="text-xs text-slate-500">
                            {client.defaultChargeType === 'hourly' ? `£${client.defaultChargeRate}/hr` : `£${client.defaultChargeRate} fixed`}
                        </span>
                    </div>
                </div>
                <ClientActionsMenu client={client} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} />
            </div>
        </motion.div>
    )
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function ClientRow({
    client,
    onClick,
    onEdit,
    onStatusChange,
    onDelete,
}: {
    client: Client
    onClick: () => void
    onEdit: () => void
    onStatusChange: () => void
    onDelete: () => void
}) {
    const initials = client.name.split(' ').map(w => w[0]).slice(0, 2).join('')
    return (
        <tr
            className="hover:bg-slate-50/60 cursor-pointer transition-colors group"
            onClick={onClick}
        >
            <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-[#1E3A5F]">{initials}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{client.name}</p>
                        {client.primaryContact?.name && (
                            <p className="text-xs text-slate-400 truncate">{client.primaryContact.name}</p>
                        )}
                    </div>
                </div>
            </td>
            <td className="px-4 py-3.5 hidden md:table-cell">
                <p className="text-sm text-slate-600 truncate max-w-[180px]">{client.formattedAddress || '—'}</p>
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell">
                <div className="flex flex-col gap-0.5">
                    {client.primaryContact?.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 min-w-0">
                            <Mail size={10} className="shrink-0 text-slate-400" />
                            <span className="truncate max-w-[160px]">{client.primaryContact.email}</span>
                        </span>
                    )}
                    {(client.phone || client.primaryContact?.phone) && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone size={10} className="shrink-0 text-slate-400" />
                            {client.phone || client.primaryContact?.phone}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3.5 hidden sm:table-cell">
                <ClientStatusBadge status={client.status} />
            </td>
            <td className="px-4 py-3.5 hidden lg:table-cell text-sm text-slate-600">
                {client.jobCount ?? 0}
            </td>
            <td className="px-4 py-3.5 text-sm text-slate-600 hidden md:table-cell">
                {client.defaultChargeType === 'hourly'
                    ? `£${client.defaultChargeRate.toFixed(2)}/hr`
                    : `£${client.defaultChargeRate.toFixed(2)}`}
            </td>
            <td className="px-3 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                <ClientActionsMenu client={client} onEdit={onEdit} onStatusChange={onStatusChange} onDelete={onDelete} />
            </td>
        </tr>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function ClientsEmptyState({ filter, onAdd }: { filter: FilterType; onAdd: () => void }) {
    if (filter !== 'all') {
        return (
            <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                    <Building2 size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">No {filter} clients</p>
                <p className="text-sm text-slate-400">Try a different filter.</p>
            </div>
        )
    }
    return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-4">
                <Building2 size={26} className="text-[#1E3A5F]" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1.5">No clients yet</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
                Add the organisations your company works with so jobs, locations and invoices can be organised properly.
            </p>
            <button
                onClick={onAdd}
                className="h-9 px-5 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
            >
                <Plus size={13} /> Add your first client
            </button>
        </div>
    )
}

// ─── Mark Inactive / Reactivate dialog ───────────────────────────────────────

function ClientStatusDialog({
    client,
    onConfirm,
    onClose,
}: {
    client: Client
    onConfirm: () => void
    onClose: () => void
}) {
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
                    {isActive ? (
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Existing jobs, invoices and history will remain.<br />
                            You can reactivate this client later.
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500 leading-relaxed">
                            <span className="font-semibold text-slate-700">{client.name}</span> will be restored to active status and appear in client suggestions for new jobs.
                        </p>
                    )}
                </div>
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`h-9 px-5 text-sm font-bold rounded-xl transition-colors ${isActive
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                    >
                        {isActive ? 'Mark inactive' : 'Reactivate client'}
                    </button>
                </div>
            </div>
        </DialogBackdrop>
    )
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteClientDialog({
    client,
    blocked,
    message,
    onConfirm,
    onMarkInactive,
    onClose,
}: {
    client: Client
    blocked?: boolean
    message?: string | null
    onConfirm: () => void
    onMarkInactive: () => void
    onClose: () => void
}) {
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
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {message ?? <><span className="font-semibold text-slate-700">{client.name}</span> is linked to existing records. Mark the client inactive instead.</>}
                            </p>
                        </>
                    ) : (
                        <>
                            <h3 className="text-base font-bold text-slate-900 mb-2">Delete {client.name}?</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mb-2">
                                This client will be removed from active client lists. Existing historical jobs and invoices will remain intact.
                            </p>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                If you simply no longer work with this client, mark them inactive instead.
                            </p>
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

// ─── Client form (create / edit) ──────────────────────────────────────────────

interface ClientFormData {
    name: string
    contactName: string
    contactRole: string
    contactEmail: string
    contactPhone: string
    phone: string
    billingEmail: string
    vatNumber: string
    addressLine1: string
    city: string
    postcode: string
    defaultChargeType: 'hourly' | 'fixed'
    defaultChargeRate: string
    paymentTermsDays: string
    notes: string
}

const emptyForm = (): ClientFormData => ({
    name: '', contactName: '', contactRole: '', contactEmail: '', contactPhone: '',
    phone: '', billingEmail: '', vatNumber: '',
    addressLine1: '', city: '', postcode: '',
    defaultChargeType: 'hourly', defaultChargeRate: '',
    paymentTermsDays: '30', notes: '',
})

function ClientForm({
    initial,
    onSave,
    onClose,
}: {
    initial?: Client
    onSave: (data: ClientFormData) => void
    onClose: () => void
}) {
    const [form, setForm] = useState<ClientFormData>(() =>
        initial ? {
            name: initial.name,
            contactName: initial.primaryContact?.name ?? '',
            contactRole: initial.primaryContact?.role ?? '',
            contactEmail: initial.primaryContact?.email ?? '',
            contactPhone: initial.primaryContact?.phone ?? '',
            phone: initial.phone ?? '',
            billingEmail: initial.billingEmail ?? '',
            vatNumber: initial.vatNumber ?? '',
            addressLine1: initial.address?.line1 ?? '',
            city: initial.address?.city ?? '',
            postcode: initial.address?.postcode ?? '',
            defaultChargeType: initial.defaultChargeType,
            defaultChargeRate: String(initial.defaultChargeRate),
            paymentTermsDays: String(initial.paymentTermsDays),
            notes: initial.notes ?? '',
        } : emptyForm()
    )
    const [showBilling, setShowBilling] = useState(false)
    const set = (k: keyof ClientFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }))

    const valid = form.name.trim().length > 0

    return (
        <DialogBackdrop onClose={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] shrink-0">
                    <h2 className="text-base font-bold text-slate-900">{initial ? 'Edit client' : 'Add new client'}</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
                    {/* Client name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Client name <span className="text-red-400">*</span></label>
                        <input value={form.name} onChange={set('name')} placeholder="e.g. ABC Property Management"
                            className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
                    </div>

                    {/* Primary contact */}
                    <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Primary contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput label="Name" value={form.contactName} onChange={set('contactName')} placeholder="Sarah Williams" />
                            <FormInput label="Role" value={form.contactRole} onChange={set('contactRole')} placeholder="Facilities Manager" />
                            <FormInput label="Email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="sarah@client.co.uk" type="email" />
                            <FormInput label="Phone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="07700 900123" />
                        </div>
                    </div>

                    {/* Business contact */}
                    <div className="grid grid-cols-2 gap-3">
                        <FormInput label="Office phone" value={form.phone} onChange={set('phone')} placeholder="020 7946 0001" />
                        <FormInput label="Billing email" value={form.billingEmail} onChange={set('billingEmail')} placeholder="accounts@client.co.uk" type="email" />
                    </div>

                    {/* Default charges */}
                    <div>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Default charge settings</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[11px] text-slate-500 mb-1">Charge type</label>
                                <select value={form.defaultChargeType} onChange={set('defaultChargeType')}
                                    className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all">
                                    <option value="hourly">Hourly</option>
                                    <option value="fixed">Fixed</option>
                                </select>
                            </div>
                            <FormInput
                                label={form.defaultChargeType === 'hourly' ? 'Rate (£/hr)' : 'Fixed amount (£)'}
                                value={form.defaultChargeRate}
                                onChange={set('defaultChargeRate')}
                                placeholder="28.50"
                                type="number"
                            />
                        </div>
                        <div className="mt-3">
                            <FormInput label="Payment terms (days)" value={form.paymentTermsDays} onChange={set('paymentTermsDays')} placeholder="30" type="number" />
                        </div>
                    </div>

                    {/* Billing & address toggle */}
                    <button
                        type="button"
                        onClick={() => setShowBilling(b => !b)}
                        className="text-sm font-semibold text-[#1E3A5F] flex items-center gap-1.5 hover:opacity-75 transition-opacity"
                    >
                        <span className="text-base leading-none">{showBilling ? '−' : '+'}</span>
                        {showBilling ? 'Hide' : 'Add'} address &amp; VAT details
                    </button>

                    <AnimatePresence>
                        {showBilling && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                            >
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

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internal notes</label>
                        <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Quarterly invoicing preferred…"
                            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all resize-none" />
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-[#E2E8F0] px-6 py-4 flex items-center justify-end gap-2.5 shrink-0">
                    <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
                    <button
                        onClick={() => valid && onSave(form)}
                        disabled={!valid}
                        className="h-9 px-5 text-sm font-bold rounded-xl bg-[#1E3A5F] text-white hover:bg-[#162D4A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {initial ? 'Save changes' : 'Create client'}
                    </button>
                </div>
            </div>
        </DialogBackdrop>
    )
}

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

// ─── Dialog backdrop ──────────────────────────────────────────────────────────

function DialogBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
            >
                {children}
            </motion.div>
        </motion.div>
    )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

// function Toast({ message }: { message: string }) {
//     return (
//         <motion.div
//             initial={{ opacity: 0, y: 16 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 16 }}
//             className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg"
//         >
//             {message}
//         </motion.div>
//     )
// }

// ─── Main page ────────────────────────────────────────────────────────────────

export function Clients() {
    const navigate = useNavigate()
    const onNavigate = (path: string) => navigate(path)
    const { clients } = useQuery(clientsQuery()).data as { clients: Client[] }
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')
    const [editClient, setEditClient] = useState<Client | null>(null)
    const [statusClient, setStatusClient] = useState<Client | null>(null)
    const [deleteClient, setDeleteClient] = useState<Client | null>(null)
    const [deleteBlockedMsg, setDeleteBlockedMsg] = useState<string | null>(null)

    const filtered = clients.filter(c => {
        const matchFilter = filter === 'all' || c.status === filter
        const q = search.toLowerCase()
        return matchFilter && (!q || c.name.toLowerCase().includes(q) ||
            c.primaryContact?.name?.toLowerCase().includes(q) ||
            c.formattedAddress?.toLowerCase().includes(q))
    })

    // Only `name` is required server-side, and unknown keys are rejected —
    // untouched optional fields must be omitted (undefined), not sent empty.
    const buildPayload = (data: ReturnType<typeof emptyForm>) => ({
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

    // Creation now happens on its own page (/clients/create) — this modal
    // remains only for editing an existing client.
    const handleSave = async (data: ReturnType<typeof emptyForm>) => {
        if (!editClient) return
        try {
            await customFetch.patch(`/clients/${editClient._id}`, buildPayload(data))
            toast.success('Client updated.')
            setEditClient(null)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
        } catch (err: any) {
            toast.error(err.response?.data?.msg ?? 'Failed to save client.')
        }
    }

    const handleStatusChange = async () => {
        if (!statusClient) return
        const isActive = statusClient.status === 'active'
        try {
            await customFetch.patch(`/clients/${statusClient._id}/status`, { status: isActive ? 'inactive' : 'active' })
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success(isActive ? `${statusClient.name} marked inactive.` : 'Client reactivated.')
            setStatusClient(null)
        } catch (err: any) {
            toast.error(err.response?.data?.msg ?? 'Failed to update status.')
        }
    }

    // Always attempts the real delete rather than pre-guessing from
    // jobCount — the backend also blocks on invoices, which this page's
    // list rows don't carry a count for. A blocked attempt flips the same
    // dialog into its "can't be deleted" state with the real message.
    const handleDelete = async () => {
        if (!deleteClient) return
        try {
            await customFetch.delete(`/clients/${deleteClient._id}`)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
            toast.success(`${deleteClient.name} deleted.`)
            setDeleteClient(null)
            setDeleteBlockedMsg(null)
        } catch (err: any) {
            const msg = err.response?.data?.msg
            if (err.response?.status === 400 && msg) {
                setDeleteBlockedMsg(msg)
            } else {
                toast.error(msg ?? 'Failed to delete client.')
            }
        }
    }

    const closeDeleteDialog = () => { setDeleteClient(null); setDeleteBlockedMsg(null) }

    const counts = {
        all: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clients</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Organisations your company works with.</p>
                </div>
                <button
                    onClick={() => onNavigate('/clients/create')}
                    className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2"
                >
                    <Plus size={13} /> Add client
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                    { label: 'Total clients', value: clients.length, icon: Building2 },
                    { label: 'Active', value: counts.active, icon: Users },
                    { label: 'Inactive', value: counts.inactive, icon: Archive },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#1E3A5F]/6 flex items-center justify-center shrink-0">
                            <Icon size={16} className="text-[#1E3A5F]" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-900 leading-none">{value}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters + search */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    {(['all', 'active', 'inactive'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`h-8 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {f === 'all' ? `All (${counts.all})` : f === 'active' ? `Active (${counts.active})` : `Inactive (${counts.inactive})`}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[220px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search clients…"
                        className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {filtered.length === 0 ? (
                <ClientsEmptyState filter={filter} onAdd={() => onNavigate('/clients/create')} />
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] bg-slate-50/60">
                                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Client</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Contact</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden lg:table-cell">Jobs</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Rate</th>
                                    <th className="px-3 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0]">
                                {filtered.map(client => (
                                    <ClientRow
                                        key={client._id}
                                        client={client}
                                        onClick={() => onNavigate(`/clients/${client._id}`)}
                                        onEdit={() => setEditClient(client)}
                                        onStatusChange={() => setStatusClient(client)}
                                        onDelete={() => setDeleteClient(client)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden flex flex-col gap-3">
                        {filtered.map(client => (
                            <ClientCard
                                key={client._id}
                                client={client}
                                onClick={() => onNavigate(`/clients/${client._id}`)}
                                onEdit={() => setEditClient(client)}
                                onStatusChange={() => setStatusClient(client)}
                                onDelete={() => setDeleteClient(client)}
                            />
                        ))}
                    </div>

                    {/* Pagination hint */}
                    <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
                        <span>Showing 1–{filtered.length} of {filtered.length}</span>
                        <div className="flex items-center gap-1">
                            <button disabled className="h-7 px-3 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">‹ Previous</button>
                            <button className="h-7 px-3 rounded-lg border border-[#1E3A5F]/20 text-[#1E3A5F] bg-[#1E3A5F]/5 font-semibold">1</button>
                            <button disabled className="h-7 px-3 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed">Next ›</button>
                        </div>
                    </div>
                </>
            )}

            {/* Dialogs */}
            <AnimatePresence>
                {editClient && (
                    <ClientForm initial={editClient} onSave={handleSave} onClose={() => setEditClient(null)} />
                )}
                {statusClient && (
                    <ClientStatusDialog client={statusClient} onConfirm={handleStatusChange} onClose={() => setStatusClient(null)} />
                )}
                {deleteClient && (
                    <DeleteClientDialog
                        client={deleteClient}
                        blocked={!!deleteBlockedMsg}
                        message={deleteBlockedMsg}
                        onConfirm={handleDelete}
                        onMarkInactive={() => { setStatusClient(deleteClient); closeDeleteDialog() }}
                        onClose={closeDeleteDialog}
                    />
                )}
            </AnimatePresence>

         
        </div>
    )
}

// Re-export types needed by other components
export { ClientStatusBadge, DialogBackdrop, emptyForm }
export type { ClientFormData }

