import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, X, LayoutList, Columns3, Globe, Phone, Mail,
  TrendingUp, AlertCircle, CheckCircle2,
  MoreHorizontal, Filter, Pencil,
  CalendarClock, FileText, Building2, Ban, Users, Loader2,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import customFetch from '@/utils/customFetch'
import { backLinkState } from '@/hooks/useBackLink'
import { leadsQuery, leadSummaryQuery, assignableUsersQuery, fmtLeadValue, formatFollowUp } from '@/utils/leads'
import { getInitials } from '@/utils/getInitials'
import {
  STAGE_CONFIG, SOURCE_CONFIG, LOST_REASONS,
  type Lead, type LeadStage, type LeadSource,
} from '@/utils/types/lead'

// ─── Badges ───────────────────────────────────────────────────────────────────

export function LeadStageBadge({ stage }: { stage: LeadStage | null }) {
  if (!stage) return <span className="text-[11px] text-slate-300">—</span>
  const cfg = STAGE_CONFIG[stage]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ring-1 ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export function LeadSourceBadge({ source }: { source?: LeadSource }) {
  if (!source) return <span className="text-[11px] text-slate-300">—</span>
  const icons: Record<LeadSource, typeof Globe> = {
    website_quote: Globe, phone: Phone, email: Mail,
    referral: Users, walk_in: Building2, other: Filter,
  }
  const Icon = icons[source]
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      <Icon size={10} className="text-slate-400" />
      {SOURCE_CONFIG[source].label}
    </span>
  )
}

function FollowUpBadge({ value }: { value?: string | null }) {
  const label = formatFollowUp(value)
  if (!label) return <span className="text-[11px] text-slate-300">—</span>
  const cls = label.variant === 'overdue' ? 'text-red-600'
    : label.variant === 'today' ? 'text-amber-600'
    : label.variant === 'tomorrow' ? 'text-blue-600'
    : 'text-slate-500'
  return (
    <span className={`text-[11px] font-semibold ${cls}`}>
      {label.variant === 'overdue' && <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mr-1 mb-0.5" />}
      {label.text}
    </span>
  )
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function RowMenu({
  lead, onView, onMarkLost,
}: {
  lead: Lead
  onView: () => void
  onMarkLost: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal size={14} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.09 }}
              className="absolute right-0 top-8 z-20 w-48 bg-white rounded-lg border border-[#E2E8F0] shadow-xl py-1 overflow-hidden"
            >
              <button onClick={() => { setOpen(false); onView() }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Building2 size={12} className="text-slate-400" /> View lead
              </button>
              {lead.lifecycle === 'lead' && (
                <button onClick={() => { setOpen(false); onMarkLost() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Ban size={12} /> Mark as lost
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Add Lead Modal ───────────────────────────────────────────────────────────

function AddLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { data: users } = useQuery(assignableUsersQuery())
  const [form, setForm] = useState({
    name: '', phone: '', billingEmail: '', leadSource: 'website_quote' as LeadSource,
    assignedTo: '', leadStage: 'new' as LeadStage, estimatedValue: '',
    contactName: '', contactRole: '', contactEmail: '', contactPhone: '',
    nextFollowUpAt: '', notes: '',
  })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inputCls = 'w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/50 bg-white'
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'

  const createMutation = useMutation({
    mutationFn: () => customFetch.post('/leads', {
      name: form.name.trim(),
      phone: form.phone || undefined,
      billingEmail: form.billingEmail || undefined,
      leadSource: form.leadSource,
      leadStage: form.leadStage,
      assignedTo: form.assignedTo || null,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      nextFollowUpAt: form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString() : undefined,
      notes: form.notes || undefined,
      contacts: form.contactName
        ? [{ name: form.contactName, role: form.contactRole, email: form.contactEmail, phone: form.contactPhone, isPrimary: true }]
        : undefined,
    }),
    onSuccess: ({ data }) => {
      toast.success('Lead created.')
      onCreated(data.lead._id)
    },
    onError: (err: unknown) => {
      const message = isAxiosError(err) ? err.response?.data?.msg ?? 'Failed to create lead.' : 'Failed to create lead.'
      toast.error(message)
    },
  })

  const canSubmit = form.name.trim().length > 0 && !createMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add Lead</h2>
            <p className="text-xs text-slate-400 mt-0.5">Create a new sales opportunity and track it through your pipeline.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Basic Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Lead / Business Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="ABC Cleaning Ltd" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01234 567890" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Billing / Contact Email</label>
                <input value={form.billingEmail} onChange={e => set('billingEmail', e.target.value)} placeholder="info@example.co.uk" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Source</label>
                <select value={form.leadSource} onChange={e => set('leadSource', e.target.value)} className={inputCls}>
                  {Object.entries(SOURCE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Assigned To</label>
                <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} className={inputCls}>
                  <option value="">Unassigned</option>
                  {users?.map(u => <option key={u._id} value={u._id}>{u.fullname}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Primary Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contact Name</label>
                <input value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Sarah Jones" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input value={form.contactRole} onChange={e => set('contactRole', e.target.value)} placeholder="Operations Manager" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} placeholder="sarah@example.co.uk" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="07123 456789" className={inputCls} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sales Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Lead Stage</label>
                <select value={form.leadStage} onChange={e => set('leadStage', e.target.value)} className={inputCls}>
                  {Object.entries(STAGE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estimated Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">£</span>
                  <input type="number" min={0} value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} placeholder="0" className={`${inputCls} pl-7`} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Next Follow-up</label>
                <input type="datetime-local" value={form.nextFollowUpAt} onChange={e => set('nextFollowUpAt', e.target.value)} className={inputCls} />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Notes</h3>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={4}
              placeholder="Add notes about this lead..." className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/50 resize-none" />
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#F1F5F9] bg-[#F8FAFC] rounded-b-xl">
          <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
            className="h-9 px-5 text-sm font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
            Save Lead
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Mark Lost Modal ──────────────────────────────────────────────────────────

function MarkLostModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')

  const lostMutation = useMutation({
    mutationFn: () => customFetch.post(`/leads/${lead._id}/lost`, { reason }),
    onSuccess: () => {
      toast.success(`${lead.name} marked as lost.`)
      onDone()
    },
    onError: (err: unknown) => {
      const message = isAxiosError(err) ? err.response?.data?.msg ?? 'Failed to mark as lost.' : 'Failed to mark as lost.'
      toast.error(message)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md"
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
              <Ban size={14} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Why was this lead lost?</h3>
              <p className="text-xs text-slate-500 mt-0.5">{lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X size={13} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            {LOST_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`h-8 px-3 text-xs font-semibold rounded-lg border transition-colors text-left ${reason === r ? 'border-[#1E3A5F] bg-[#1E3A5F]/6 text-[#1E3A5F]' : 'border-[#E2E8F0] text-slate-600 hover:bg-slate-50'}`}>
                {r}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => lostMutation.mutate()} disabled={!reason || lostMutation.isPending}
              className="h-9 px-4 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors flex items-center gap-2">
              {lostMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Mark as Lost
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Summary Cards ────────────────────────────────────────────────────────────

function SummaryCards() {
  const { data } = useQuery(leadSummaryQuery())
  const s = data?.summary

  const cards = [
    { label: 'Open Leads', value: s ? String(s.openLeads) : '—', icon: Building2, color: 'text-[#1E3A5F]', bg: 'bg-[#1E3A5F]/6' },
    { label: 'Needs Follow-up', value: s ? String(s.overdueFollowUps) : '—', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', alert: !!s && s.overdueFollowUps > 0 },
    { label: 'Quotes Sent', value: s ? String(s.quotesSent) : '—', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Converted This Month', value: s ? String(s.convertedThisMonth) : '—', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pipeline Value', value: s ? fmtLeadValue(s.estimatedPipelineValue) : '—', icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(c => (
        <div key={c.label} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${c.alert ? 'border-amber-200' : 'border-[#E2E8F0]'}`}>
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0 mt-0.5`}>
            <c.icon size={14} className={c.color} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Pipeline (Kanban) View ───────────────────────────────────────────────────

function PipelineView({ leads, onSelect }: { leads: Lead[]; onSelect: (id: string) => void }) {
  const stages: LeadStage[] = ['new', 'contacted', 'call_booked', 'quote_sent', 'negotiating']

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {stages.map(stage => {
        const stageLeads = leads.filter(l => l.leadStage === stage)
        const stageValue = stageLeads.reduce((s, l) => s + l.estimatedValue, 0)
        return (
          <div key={stage} className="flex flex-col gap-3 min-w-[230px] w-[230px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LeadStageBadge stage={stage} />
                <span className="text-xs text-slate-400 font-medium">{stageLeads.length}</span>
              </div>
              {stageValue > 0 && <span className="text-[11px] font-bold text-slate-400">{fmtLeadValue(stageValue)}</span>}
            </div>

            <div className="flex flex-col gap-2.5">
              {stageLeads.map(lead => (
                <button
                  key={lead._id}
                  onClick={() => onSelect(lead._id)}
                  className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 text-left hover:border-slate-300 hover:shadow-md transition-all group"
                >
                  <p className="text-sm font-bold text-slate-900 leading-snug">{lead.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lead.primaryContact?.name ?? lead.contacts[0]?.name ?? '—'}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    {lead.estimatedValue > 0
                      ? <span className="text-xs font-bold text-slate-700">{fmtLeadValue(lead.estimatedValue)}</span>
                      : <span className="text-xs text-slate-300">No value</span>}
                    <LeadSourceBadge source={lead.leadSource} />
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#F8FAFC] flex items-center justify-between">
                    <FollowUpBadge value={lead.nextFollowUpAt} />
                    <span className="text-[10px] text-slate-400">{lead.assignedTo?.fullname ?? 'Unassigned'}</span>
                  </div>
                </button>
              ))}
              {stageLeads.length === 0 && (
                <div className="border-2 border-dashed border-slate-100 rounded-xl h-20 flex items-center justify-center">
                  <span className="text-xs text-slate-300">No leads</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ leads, onSelect, onMarkLost }: {
  leads: Lead[]
  onSelect: (id: string) => void
  onMarkLost: (l: Lead) => void
}) {
  if (leads.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center py-20 text-center">
        <Building2 size={22} className="text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-500 mb-1">No leads match your filters</p>
        <p className="text-xs text-slate-400">Try changing your search or clearing filters.</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_160px_130px_110px_140px_100px_130px_36px] gap-0 px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        {['Lead', 'Stage', 'Source', 'Assigned', 'Follow-up', 'Value', 'Updated', ''].map(h => (
          <span key={h} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
        ))}
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {leads.map((lead, i) => (
          <motion.div
            key={lead._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(lead._id)}
            className="grid grid-cols-[1fr_160px_130px_110px_140px_100px_130px_36px] gap-0 px-4 py-3.5 hover:bg-[#F8FAFC] cursor-pointer transition-colors group items-center"
          >
            <div className="min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-slate-500">{getInitials(lead.name)}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{lead.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {lead.primaryContact?.name ?? lead.contacts[0]?.name ?? '—'} · {lead.primaryContact?.email ?? lead.contacts[0]?.email ?? ''}
                  </p>
                </div>
              </div>
            </div>

            <div>
              {lead.lifecycle === 'lost'
                ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ring-1 bg-red-50 text-red-600 ring-red-200">Lost</span>
                : lead.lifecycle === 'client'
                  ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">Converted</span>
                  : <LeadStageBadge stage={lead.leadStage} />}
            </div>

            <div><LeadSourceBadge source={lead.leadSource} /></div>

            <div className="text-xs text-slate-600">{lead.assignedTo?.fullname ?? 'Unassigned'}</div>

            <div><FollowUpBadge value={lead.nextFollowUpAt} /></div>

            <div>
              {lead.estimatedValue > 0
                ? <span className="text-sm font-bold text-slate-800 tabular-nums">{fmtLeadValue(lead.estimatedValue)}</span>
                : <span className="text-xs text-slate-300">—</span>}
            </div>

            <div className="text-[11px] text-slate-400 truncate">
              {new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </div>

            <div onClick={e => e.stopPropagation()}>
              <RowMenu lead={lead} onView={() => onSelect(lead._id)} onMarkLost={() => onMarkLost(lead)} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <p className="text-xs text-slate-400">{leads.length} lead{leads.length !== 1 ? 's' : ''}</p>
        <p className="text-xs font-semibold text-slate-600 tabular-nums">
          {fmtLeadValue(leads.reduce((s, l) => s + l.estimatedValue, 0))} total value
        </p>
      </div>
    </div>
  )
}

// ─── Main Leads Page ──────────────────────────────────────────────────────────

type LeadsTab = 'open' | 'lost' | 'converted'

export const loader = (queryClient: QueryClient) => async () => {
  await Promise.all([
    queryClient.ensureQueryData(leadsQuery('open')),
    queryClient.ensureQueryData(leadSummaryQuery()),
  ])
  return null
}

export function Leads() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const onNavigate = (path: string, state?: object) => navigate(path, { state: state ?? backLinkState('Leads') })

  const [tab, setTab] = useState<LeadsTab>('open')
  const [viewMode, setViewMode] = useState<'table' | 'pipeline'>('table')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all')
  const [followUpFilter, setFollowUpFilter] = useState<string>('all')
  const [showAddLead, setShowAddLead] = useState(false)
  const [lostModal, setLostModal] = useState<Lead | null>(null)

  const { data } = useQuery(leadsQuery(tab))
  const tabLeads = data?.leads ?? []

  const filtered = tabLeads.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.name.toLowerCase().includes(q)
      || l.contacts.some(c => (c.name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q))
    const matchStage = stageFilter === 'all' || l.leadStage === stageFilter
    const label = formatFollowUp(l.nextFollowUpAt)
    const matchFollowUp = followUpFilter === 'all'
      || (followUpFilter === 'overdue' && label?.variant === 'overdue')
      || (followUpFilter === 'today' && label?.variant === 'today')
      || (followUpFilter === 'none' && !l.nextFollowUpAt)
    return matchSearch && matchStage && matchFollowUp
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['leads'] })
    qc.invalidateQueries({ queryKey: ['leads-summary'] })
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6 py-7 flex flex-col gap-5">

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track prospects, follow up, send quotes and convert opportunities into clients.</p>
          </div>
          <button
            onClick={() => setShowAddLead(true)}
            className="h-9 px-4 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>

        <SummaryCards />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-0.5 bg-white border border-[#E2E8F0] rounded-lg p-0.5">
            {([
              { id: 'open' as const, label: 'Open' },
              { id: 'lost' as const, label: 'Lost' },
              { id: 'converted' as const, label: 'Converted' },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`h-7 px-4 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'open' && (
            <div className="flex items-center gap-0.5 bg-white border border-[#E2E8F0] rounded-lg p-0.5">
              <button onClick={() => setViewMode('table')}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#1E3A5F] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <LayoutList size={13} />
              </button>
              <button onClick={() => setViewMode('pipeline')}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${viewMode === 'pipeline' ? 'bg-[#1E3A5F] text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                <Columns3 size={13} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
              className="w-full h-9 pl-8 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/12 focus:border-[#1E3A5F]/40" />
          </div>

          {tab === 'open' && (
            <>
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value as LeadStage | 'all')}
                className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-xs text-slate-600 bg-white focus:outline-none">
                <option value="all">All stages</option>
                {Object.entries(STAGE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={followUpFilter} onChange={e => setFollowUpFilter(e.target.value)}
                className="h-9 px-3 border border-[#E2E8F0] rounded-lg text-xs text-slate-600 bg-white focus:outline-none">
                <option value="all">All follow-ups</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due today</option>
                <option value="none">No follow-up</option>
              </select>
            </>
          )}

          {(search || stageFilter !== 'all' || followUpFilter !== 'all') && (
            <button onClick={() => { setSearch(''); setStageFilter('all'); setFollowUpFilter('all') }}
              className="h-9 px-3 text-xs font-semibold text-slate-500 border border-[#E2E8F0] bg-white rounded-lg hover:bg-slate-50 flex items-center gap-1.5">
              <X size={11} /> Clear filters
            </button>
          )}
        </div>

        {viewMode === 'pipeline' && tab === 'open' ? (
          <PipelineView leads={filtered} onSelect={id => onNavigate(`/leads/${id}`)} />
        ) : (
          <TableView
            leads={filtered}
            onSelect={id => onNavigate(`/leads/${id}`)}
            onMarkLost={l => setLostModal(l)}
          />
        )}
      </div>

      <AnimatePresence>
        {showAddLead && (
          <AddLeadModal
            onClose={() => setShowAddLead(false)}
            onCreated={id => { setShowAddLead(false); invalidateAll(); onNavigate(`/leads/${id}`) }}
          />
        )}
        {lostModal && (
          <MarkLostModal
            lead={lostModal}
            onClose={() => setLostModal(null)}
            onDone={() => { setLostModal(null); invalidateAll() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
