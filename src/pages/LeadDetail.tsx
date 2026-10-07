import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, MoreHorizontal, Plus, X, Pencil, Check,
  Phone, Mail, MapPin, CalendarClock, FileText, Building2,
  Ban, CheckCircle2, ExternalLink, Clock, AlertTriangle,
  Globe, RefreshCw, MessageSquare, Loader2, Send, ClipboardList,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { redirect, useNavigate, useParams, type LoaderFunctionArgs } from 'react-router'
import toast from 'react-hot-toast'
import { isAxiosError } from 'axios'
import customFetch from '@/utils/customFetch'
import { backLinkState } from '@/hooks/useBackLink'
import { leadDetailQuery, assignableUsersQuery, fmtLeadValue, formatFollowUp } from '@/utils/leads'
import { clientDetailQuery } from '@/utils/clients'
import { getInitials } from '@/utils/getInitials'
import { STAGE_CONFIG, LOST_REASONS, type Lead, type LeadStage, type LeadQuoteRef } from '@/utils/types/lead'
import { LeadStageBadge, LeadSourceBadge } from './Leads'
import { QuoteStatusBadge } from './Quotes'

// ─── Data loader ──────────────────────────────────────────────────────────────

export const loader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
  const id = params.id as string
  try {
    await queryClient.ensureQueryData(leadDetailQuery(id))
    return null
  } catch (err) {
    // leadController.ts only ever matches lifecycle "lead"/"lost" — a lead
    // that's since been converted to a client (e.g. by accepting a quote,
    // see quoteController.ts's respondToPublicQuote) 404s here even though
    // the record still exists, just as a Client now. Same _id either way
    // (conversion is an in-place lifecycle flip, not a new document), so a
    // client lookup on the same id tells us whether that's what happened.
    if (isAxiosError(err) && err.response?.status === 404) {
      try {
        await queryClient.ensureQueryData(clientDetailQuery(id))
        return redirect(`/clients/${id}`)
      } catch {
        // Not a client either — genuinely not found, fall through.
      }
    }
    throw err
  }
}

const invalidateLead = (qc: ReturnType<typeof useQueryClient>, id: string) => {
  qc.invalidateQueries({ queryKey: ['lead', id] })
  qc.invalidateQueries({ queryKey: ['leads'] })
  qc.invalidateQueries({ queryKey: ['leads-summary'] })
}

const mutationErrorMessage = (err: unknown, fallback: string) =>
  isAxiosError(err) ? err.response?.data?.msg ?? fallback : fallback

// ─── Follow-up Modal ──────────────────────────────────────────────────────────

function AddFollowUpModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')

  const mutation = useMutation({
    mutationFn: () => customFetch.patch(`/leads/${lead._id}/follow-up`, {
      nextFollowUpAt: new Date(`${date}T${time}`).toISOString(),
    }),
    onSuccess: () => { toast.success('Follow-up scheduled.'); onDone() },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to schedule follow-up.')),
  })

  const inputCls = 'w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/50 bg-white'
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-900">Schedule Follow-up</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X size={13} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date <span className="text-red-400">*</span></label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!date || mutation.isPending}
              className="h-9 px-4 text-sm font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] disabled:opacity-50 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Schedule Follow-up
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
// The backend's `notes` is a single field, not a log — this appends a
// timestamped block to whatever's already there rather than replacing it,
// since "Add Note" implies accumulating, not overwriting.

function AddNoteModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const stamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      const entry = `[${stamp}] ${note.trim()}`
      const nextNotes = lead.notes ? `${lead.notes}\n\n${entry}` : entry
      return customFetch.patch(`/leads/${lead._id}`, { notes: nextNotes })
    },
    onSuccess: () => { toast.success('Note added.'); onDone() },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to add note.')),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-900">Add Note</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X size={13} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={5} autoFocus
            placeholder="Spoke with Sarah. She wants to review the quote with the director before Friday..."
            className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 resize-none" />
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!note.trim() || mutation.isPending}
              className="h-9 px-4 text-sm font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] disabled:opacity-40 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Add Note
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Add Contact Modal ────────────────────────────────────────────────────────

function AddContactModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', isPrimary: false })
  const inputCls = 'w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/50 bg-white'
  const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'

  const mutation = useMutation({
    mutationFn: () => {
      const existing = form.isPrimary ? lead.contacts.map(c => ({ ...c, isPrimary: false })) : lead.contacts
      return customFetch.patch(`/leads/${lead._id}`, { contacts: [...existing, form] })
    },
    onSuccess: () => { toast.success('Contact added.'); onDone() },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to add contact.')),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-slate-900">Add Contact</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X size={13} /></button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div><label className={labelCls}>Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sarah Jones" className={inputCls} /></div>
          <div><label className={labelCls}>Role</label><input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Operations Manager" className={inputCls} /></div>
          <div><label className={labelCls}>Email</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="sarah@example.co.uk" className={inputCls} /></div>
          <div><label className={labelCls}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="07123 456789" className={inputCls} /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <div onClick={() => setForm(f => ({ ...f, isPrimary: !f.isPrimary }))}
              className={`w-8 h-4.5 rounded-full transition-colors flex items-center p-0.5 ${form.isPrimary ? 'bg-[#1E3A5F]' : 'bg-slate-200'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${form.isPrimary ? 'translate-x-3.5' : ''}`} />
            </div>
            <span className="text-xs font-semibold text-slate-600">Mark as primary contact</span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}
              className="h-9 px-4 text-sm font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] disabled:opacity-50 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Add Contact
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Convert Modal ────────────────────────────────────────────────────────────

function ConvertModal({ lead, onClose, onConverted }: { lead: Lead; onClose: () => void; onConverted: (clientId: string) => void }) {
  const [done, setDone] = useState(false)
  const [chargeType, setChargeType] = useState<'hourly' | 'fixed'>('hourly')
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)

  const mutation = useMutation({
    mutationFn: () => customFetch.post(`/leads/${lead._id}/convert`, {
      defaultChargeType: chargeType,
      paymentTermsDays,
    }),
    onSuccess: () => setDone(true),
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to convert lead.')),
  })

  if (done) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={22} className="text-emerald-600" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Lead converted successfully</h3>
        <p className="text-sm text-slate-500 mb-5">{lead.name} is now an active client.</p>
        <button onClick={() => onConverted(lead._id)} className="h-9 px-6 text-sm font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A]">View Client</button>
      </motion.div>
    </div>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Convert lead to client?</h3>
              <p className="text-xs text-slate-500 mt-0.5">{lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-400"><X size={13} /></button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>{lead.name}</strong> will be moved from your sales pipeline into active clients.
            Existing contacts, address, notes and quote history will be preserved.
          </p>
          <div className="bg-slate-50 border border-[#E2E8F0] rounded-lg p-4 flex flex-col gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Charge Type</label>
              <div className="flex gap-2">
                {(['hourly', 'fixed'] as const).map(t => (
                  <button key={t} onClick={() => setChargeType(t)}
                    className={`h-8 flex-1 text-xs font-semibold rounded-lg border transition-colors capitalize ${chargeType === t ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' : 'border-[#E2E8F0] text-slate-600 bg-white hover:bg-slate-50'}`}>
                    {t === 'hourly' ? 'Hourly rate' : 'Fixed price'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Terms</label>
              <select value={paymentTermsDays} onChange={e => setPaymentTermsDays(Number(e.target.value))}
                className="w-full h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white focus:outline-none">
                <option value={30}>30 days</option><option value={14}>14 days</option><option value={7}>7 days</option><option value={0}>Immediate</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={mutation.isPending}
              className="h-9 px-4 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Convert to Client
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Mark Lost / Restore ──────────────────────────────────────────────────────

function MarkLostModal({ lead, onClose, onDone }: { lead: Lead; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const mutation = useMutation({
    mutationFn: () => customFetch.post(`/leads/${lead._id}/lost`, { reason }),
    onSuccess: () => { toast.success('Lead marked as lost.'); onDone() },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to mark as lost.')),
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#F1F5F9]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5"><Ban size={14} className="text-red-600" /></div>
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
          <div className="flex items-center justify-end gap-2">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button onClick={() => mutation.mutate()} disabled={!reason || mutation.isPending}
              className="h-9 px-4 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center gap-2">
              {mutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Mark as Lost
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Synthesized activity feed ────────────────────────────────────────────────
// There's no generic activity log on the backend (see leadController.ts's own
// header note) — this builds a best-effort timeline from what the API does
// return: lifecycle transitions (lifecycleHistory) and quote milestones.
// Honest about what it is: real events, not a complete audit trail.

interface FeedEvent {
  id: string
  ts: string
  label: string
  detail?: string
  actor?: string
  icon: typeof FileText
  colorCls: string
}

function buildActivityFeed(lead: Lead, quotes: LeadQuoteRef[]): FeedEvent[] {
  const events: FeedEvent[] = [
    {
      id: 'created',
      ts: lead.createdAt,
      label: 'Lead created',
      detail: lead.createdBy?.fullname,
      icon: Building2,
      colorCls: 'bg-emerald-100 text-emerald-700',
    },
  ]

  for (const h of lead.lifecycleHistory ?? []) {
    events.push({
      id: `lifecycle-${h.at}`,
      ts: h.at,
      label: h.to === 'client' ? 'Converted to client' : h.to === 'lost' ? 'Marked as lost' : 'Lead restored',
      detail: h.reason || undefined,
      actor: h.by?.fullname,
      icon: h.to === 'client' ? CheckCircle2 : h.to === 'lost' ? Ban : RefreshCw,
      colorCls: h.to === 'client' ? 'bg-emerald-100 text-emerald-700' : h.to === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700',
    })
  }

  for (const q of quotes) {
    if (q.sentAt) events.push({ id: `${q._id}-sent`, ts: q.sentAt, label: `Quote ${q.quoteNumber} sent`, detail: fmtLeadValue(q.total), icon: FileText, colorCls: 'bg-blue-100 text-blue-700' })
    if (q.acceptedAt) events.push({ id: `${q._id}-accepted`, ts: q.acceptedAt, label: `Quote ${q.quoteNumber} accepted`, detail: fmtLeadValue(q.total), icon: CheckCircle2, colorCls: 'bg-emerald-100 text-emerald-700' })
    if (q.declinedAt) events.push({ id: `${q._id}-declined`, ts: q.declinedAt, label: `Quote ${q.quoteNumber} declined`, icon: X, colorCls: 'bg-red-100 text-red-700' })
  }

  if (lead.lastContactedAt) {
    events.push({ id: 'contacted', ts: lead.lastContactedAt, label: 'Lead contacted', icon: Phone, colorCls: 'bg-[#1E3A5F]/10 text-[#1E3A5F]' })
  }

  return events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
}

function ActivityTimeline({ lead, quotes }: { lead: Lead; quotes: LeadQuoteRef[] }) {
  const events = buildActivityFeed(lead, quotes)
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F1F5F9]">
        <h3 className="text-sm font-bold text-slate-800">Activity</h3>
      </div>
      <div className="px-5 py-4">
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <Clock size={16} className="text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-[#F1F5F9]" />
            <div className="flex flex-col gap-5">
              {events.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${event.colorCls}`}>
                    <event.icon size={10} />
                  </div>
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-700">{event.label}{event.detail ? <span className="text-slate-400"> — {event.detail}</span> : ''}</p>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {new Date(event.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {event.actor && <p className="text-[11px] text-slate-400 mt-0.5">{event.actor}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar widgets ──────────────────────────────────────────────────────────

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#F1F5F9]">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function OverviewSidebar({ lead }: { lead: Lead }) {
  const qc = useQueryClient()
  const { data: users } = useQuery(assignableUsersQuery())
  const [editStage, setEditStage] = useState(false)

  const stageMutation = useMutation({
    mutationFn: (stage: LeadStage) => customFetch.patch(`/leads/${lead._id}/stage`, { stage }),
    onSuccess: () => invalidateLead(qc, lead._id),
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to change stage.')),
  })
  const assignMutation = useMutation({
    mutationFn: (assignedTo: string) => customFetch.patch(`/leads/${lead._id}/assign`, { assignedTo: assignedTo || null }),
    onSuccess: () => invalidateLead(qc, lead._id),
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to reassign.')),
  })
  const clearFollowUpMutation = useMutation({
    mutationFn: () => customFetch.patch(`/leads/${lead._id}/follow-up`, { nextFollowUpAt: null }),
    onSuccess: () => invalidateLead(qc, lead._id),
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to clear follow-up.')),
  })

  const followUp = formatFollowUp(lead.nextFollowUpAt)

  return (
    <div className="flex flex-col gap-4">
      <div className={`rounded-xl border p-4 ${followUp?.variant === 'overdue' ? 'border-red-200 bg-red-50/50' : 'bg-white border-[#E2E8F0]'}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Next Follow-up</h3>
        </div>
        {followUp ? (
          <div>
            {followUp.variant === 'overdue' ? (
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={13} className="text-red-600" />
                <p className="text-sm font-bold text-red-700">Overdue</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-900">{followUp.text}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button onClick={() => clearFollowUpMutation.mutate()} disabled={clearFollowUpMutation.isPending}
                className="h-7 px-2.5 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50">
                <Check size={10} /> Done
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-1">No follow-up scheduled</p>
        )}
      </div>

      <SidebarCard title="Sales Details">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Stage</span>
            {editStage ? (
              <select
                value={lead.leadStage ?? 'new'}
                onChange={e => { stageMutation.mutate(e.target.value as LeadStage); setEditStage(false) }}
                autoFocus className="text-xs border border-[#1E3A5F]/30 rounded-md px-2 py-0.5 focus:outline-none"
              >
                {Object.entries(STAGE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            ) : (
              <button onClick={() => setEditStage(true)} className="group flex items-center gap-1">
                <LeadStageBadge stage={lead.leadStage} />
                <Pencil size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Estimated value</span>
            <span className="text-sm font-bold text-slate-800">{lead.estimatedValue > 0 ? fmtLeadValue(lead.estimatedValue) : '—'}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Source</span>
            <LeadSourceBadge source={lead.leadSource} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Assigned to</span>
            <select
              value={lead.assignedTo?._id ?? ''}
              onChange={e => assignMutation.mutate(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-0 focus:outline-none cursor-pointer hover:text-[#1E3A5F] pr-0"
            >
              <option value="">Unassigned</option>
              {users?.map(u => <option key={u._id} value={u._id}>{u.fullname}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Last contacted</span>
            <span className="text-xs text-slate-600">
              {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Created</span>
            <span className="text-xs text-slate-600">{new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      </SidebarCard>
    </div>
  )
}

// ─── Quote Intake Section ───────────────────────────────────────────────────
// What the visitor actually submitted via the public quote wizard
// (Lead.quoteIntake) — only rendered for leads that came in that way.
// `estimate` was already recalculated server-side at submit time against
// the company's published Quote Workflow (never trusted from the
// visitor's own browser), so it's safe to send as-is.

function QuoteIntakeSection({ lead, onSendQuote, sending }: { lead: Lead; onSendQuote: () => void; sending: boolean }) {
  const intake = lead.quoteIntake
  if (!intake) return null

  const estimate = intake.estimate
  const serviceLabel = intake.serviceType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">Quote request</h3>
        </div>
        {estimate && !estimate.requiresManualQuote && (
          <button onClick={onSendQuote} disabled={sending}
            className="h-7 px-3 text-[11px] font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] transition-colors flex items-center gap-1 disabled:opacity-50">
            {sending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />} Send quote to client
          </button>
        )}
      </div>
      <div className="px-5 py-4">
        <p className="text-xs text-slate-400 mb-0.5">Service requested</p>
        <p className="text-sm font-semibold text-slate-800 mb-3">{serviceLabel}</p>

        {!estimate ? (
          <p className="text-xs text-slate-400">No price could be calculated for this submission — build a quote manually instead.</p>
        ) : estimate.requiresManualQuote ? (
          <p className="text-xs text-slate-400">This service requires a manual quote — build one by hand using the details below.</p>
        ) : (
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] divide-y divide-[#F1F5F9]">
            {estimate.lines.map((line, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-slate-500">{line.label}</span>
                <span className="font-semibold text-slate-700">{fmtLeadValue(line.price)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-bold text-slate-600">Estimated total</span>
              <span className="text-sm font-bold text-[#1E3A5F]">{fmtLeadValue(estimate.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quotes Section ───────────────────────────────────────────────────────────

function QuotesSection({ quotes, onCreateQuote }: { quotes: LeadQuoteRef[]; onCreateQuote: () => void }) {
  if (quotes.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-center">
        <FileText size={18} className="text-slate-200 mx-auto mb-2.5" />
        <p className="text-sm font-semibold text-slate-500 mb-1">No quotes yet</p>
        <p className="text-xs text-slate-400 mb-4">Create a quote when you're ready to send pricing to this lead.</p>
        <button onClick={onCreateQuote} className="h-8 px-4 bg-[#1E3A5F] text-white text-xs font-bold rounded-lg hover:bg-[#162D4A] transition-colors flex items-center gap-1.5 mx-auto">
          <Plus size={12} /> Create Quote
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9]">
        <h3 className="text-sm font-bold text-slate-800">Quotes</h3>
        <button onClick={onCreateQuote} className="h-7 px-3 text-[11px] font-bold text-white bg-[#1E3A5F] rounded-lg hover:bg-[#162D4A] transition-colors flex items-center gap-1">
          <Plus size={10} /> Create Quote
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
          <tr>
            {['Quote', 'Status', 'Amount', 'Sent', 'Valid Until'].map(h => (
              <th key={h} className="text-left px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F8FAFC]">
          {quotes.map(q => (
            <tr key={q._id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3">
                <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">{q.quoteNumber}</span>
              </td>
              <td className="px-4 py-3"><QuoteStatusBadge status={q.status} /></td>
              <td className="px-4 py-3 text-sm font-bold text-slate-800">{fmtLeadValue(q.total)}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{q.sentAt ? new Date(q.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{new Date(q.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Contacts Section ─────────────────────────────────────────────────────────

function ContactsSection({ lead, onAddContact }: { lead: Lead; onAddContact: () => void }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9]">
        <h3 className="text-sm font-bold text-slate-800">Contacts</h3>
        <button onClick={onAddContact} className="h-7 px-3 text-[11px] font-semibold text-[#1E3A5F] bg-[#1E3A5F]/6 rounded-lg hover:bg-[#1E3A5F]/12 transition-colors flex items-center gap-1">
          <Plus size={10} /> Add Contact
        </button>
      </div>
      {lead.contacts.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-400">No contacts added yet.</div>
      ) : (
        <div className="divide-y divide-[#F8FAFC]">
          {lead.contacts.map((contact, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[11px] font-black text-[#1E3A5F]">{getInitials(contact.name ?? '?')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                  {contact.isPrimary && (
                    <span className="text-[10px] font-bold text-[#1E3A5F] bg-[#1E3A5F]/8 px-1.5 py-0.5 rounded">Primary</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{contact.role}</p>
                <div className="flex items-center gap-4 mt-1.5">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors">
                      <Mail size={10} className="text-slate-400" /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-slate-600 hover:text-[#1E3A5F] transition-colors">
                      <Phone size={10} className="text-slate-400" /> {contact.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Notes Section ────────────────────────────────────────────────────────────

function NotesSection({ lead, onAddNote }: { lead: Lead; onAddNote: () => void }) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#F1F5F9]">
        <h3 className="text-sm font-bold text-slate-800">Notes</h3>
        <button onClick={onAddNote} className="h-7 px-3 text-[11px] font-semibold text-[#1E3A5F] bg-[#1E3A5F]/6 rounded-lg hover:bg-[#1E3A5F]/12 transition-colors flex items-center gap-1">
          <Plus size={10} /> Add Note
        </button>
      </div>
      <div className="px-5 py-4">
        {lead.notes ? (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
        ) : (
          <div className="text-center py-6">
            <MessageSquare size={16} className="text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">No notes yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Lead Detail Page ─────────────────────────────────────────────────────────

export function LeadDetail() {
  const { id } = useParams() as { id: string }
  const navigate = useNavigate()
  const qc = useQueryClient()
  const onNavigate = (path: string, state?: object) => navigate(path, state ? { state } : undefined)

  const { lead, quotes } = useQuery(leadDetailQuery(id)).data as { lead: Lead; quotes: LeadQuoteRef[] }

  const [modal, setModal] = useState<null | 'follow-up' | 'note' | 'convert' | 'lost' | 'contact'>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const isLost = lead.lifecycle === 'lost'
  const isConverted = lead.lifecycle === 'client'

  const contactedMutation = useMutation({
    mutationFn: () => customFetch.patch(`/leads/${lead._id}/contacted`),
    onSuccess: () => { toast.success('Marked as contacted.'); invalidateLead(qc, lead._id) },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to mark contacted.')),
  })
  const restoreMutation = useMutation({
    mutationFn: () => customFetch.post(`/leads/${lead._id}/restore`),
    onSuccess: () => { toast.success('Lead restored.'); invalidateLead(qc, lead._id) },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to restore lead.')),
  })
  const sendQuoteMutation = useMutation({
    mutationFn: () => customFetch.post(`/leads/${lead._id}/send-quote`),
    onSuccess: () => { toast.success('Quote sent to client.'); invalidateLead(qc, lead._id) },
    onError: (err: unknown) => toast.error(mutationErrorMessage(err, 'Failed to send quote.')),
  })

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      {isLost && (
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-3">
          <Ban size={13} className="text-red-400 shrink-0" />
          <p className="text-sm text-slate-200">
            This lead was marked as lost{lead.lostAt && <> on <strong>{new Date(lead.lostAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></>}.
            {lead.lostReason && <> Reason: <strong>{lead.lostReason}</strong>.</>}
          </p>
          <button onClick={() => restoreMutation.mutate()} disabled={restoreMutation.isPending}
            className="ml-auto h-7 px-3 text-xs font-bold text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50">
            {restoreMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />} Restore Lead
          </button>
        </div>
      )}

      {isConverted && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-3">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            Converted to client{lead.convertedAt && <> on <strong>{new Date(lead.convertedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></>}.
          </p>
          <button onClick={() => onNavigate(`/clients/${lead._id}`)}
            className="ml-auto h-7 px-3 text-xs font-bold text-emerald-700 border border-emerald-300 bg-white rounded-lg hover:bg-emerald-50 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <ExternalLink size={10} /> View Client
          </button>
        </div>
      )}

      <div className="max-w-[1140px] mx-auto px-6 py-6">
        <button onClick={() => onNavigate('/leads')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-4 transition-colors">
          <ChevronLeft size={12} /> All leads
        </button>

        <div className="bg-white border border-[#E2E8F0] rounded-xl px-6 py-5 mb-5 shadow-sm">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-[#1E3A5F]">{getInitials(lead.name)}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{lead.name}</h1>
                  {isLost
                    ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ring-1 bg-red-50 text-red-600 ring-red-200">Lost</span>
                    : isConverted
                      ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ring-1 bg-emerald-50 text-emerald-700 ring-emerald-200">Client</span>
                      : <LeadStageBadge stage={lead.leadStage} />
                  }
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <LeadSourceBadge source={lead.leadSource} />
                  <span className="text-xs text-slate-400">Assigned to {lead.assignedTo?.fullname ?? 'Unassigned'}</span>
                  <span className="text-xs text-slate-400">Created {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {lead.estimatedValue > 0 && <span className="text-xs font-bold text-slate-700">{fmtLeadValue(lead.estimatedValue)}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!isLost && !isConverted && (
                <>
                  <button onClick={() => contactedMutation.mutate()} disabled={contactedMutation.isPending}
                    className="h-9 px-3 text-sm font-semibold text-slate-700 border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 transition-colors hidden sm:flex items-center gap-1.5 disabled:opacity-50">
                    <Phone size={13} /> Mark Contacted
                  </button>
                  <button onClick={() => setModal('follow-up')} className="h-9 px-3 text-sm font-semibold text-slate-700 border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                    <CalendarClock size={13} /> Follow-up
                  </button>
                  <button onClick={() => onNavigate('/quotes/create')} className="h-9 px-3 text-sm font-semibold text-slate-700 border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 transition-colors hidden sm:flex items-center gap-1.5">
                    <FileText size={13} /> Create Quote
                  </button>
                  <button onClick={() => setModal('convert')} className="h-9 px-4 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Convert
                  </button>
                </>
              )}

              <div className="relative">
                <button onClick={() => setMoreOpen(o => !o)} className="w-9 h-9 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-xl hover:bg-slate-50 transition-colors text-slate-500">
                  <MoreHorizontal size={15} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -4 }}
                        transition={{ duration: 0.09 }}
                        className="absolute right-0 top-10 z-20 w-48 bg-white rounded-lg border border-[#E2E8F0] shadow-xl py-1"
                      >
                        <button onClick={() => { setMoreOpen(false); setModal('note') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"><MessageSquare size={12} className="text-slate-400" /> Add note</button>
                        {!isLost && !isConverted && (
                          <>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={() => { setMoreOpen(false); setModal('lost') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Ban size={12} /> Mark as lost</button>
                          </>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
          <div className="flex flex-col gap-5">
            <QuoteIntakeSection lead={lead} onSendQuote={() => sendQuoteMutation.mutate()} sending={sendQuoteMutation.isPending} />
            <ContactsSection lead={lead} onAddContact={() => setModal('contact')} />
            <QuotesSection quotes={quotes} onCreateQuote={() => onNavigate('/quotes/create')} />
            <NotesSection lead={lead} onAddNote={() => setModal('note')} />
            <ActivityTimeline lead={lead} quotes={quotes} />
          </div>

          <div className="flex flex-col gap-4 lg:sticky lg:top-4">
            <OverviewSidebar lead={lead} />

            <SidebarCard title="Address">
              {lead.address?.line1 ? (
                <div className="flex items-start gap-2">
                  <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {lead.name}<br />
                    {lead.address.line1}<br />
                    {lead.address.city}{lead.address.city && lead.address.county ? ', ' : ''}{lead.address.county}<br />
                    {lead.address.postcode}<br />
                    {lead.address.country}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No address on file.</p>
              )}
              {lead.address?.line1 && (
                <div className="flex items-center gap-2 mt-3">
                  <button className="h-6 px-2.5 text-[11px] font-semibold text-slate-600 border border-[#E2E8F0] rounded hover:bg-slate-50 flex items-center gap-1 transition-colors">
                    <Globe size={9} /> Maps
                  </button>
                </div>
              )}
            </SidebarCard>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal === 'follow-up' && <AddFollowUpModal lead={lead} onClose={() => setModal(null)} onDone={() => { setModal(null); invalidateLead(qc, lead._id) }} />}
        {modal === 'note' && <AddNoteModal lead={lead} onClose={() => setModal(null)} onDone={() => { setModal(null); invalidateLead(qc, lead._id) }} />}
        {modal === 'contact' && <AddContactModal lead={lead} onClose={() => setModal(null)} onDone={() => { setModal(null); invalidateLead(qc, lead._id) }} />}
        {modal === 'convert' && <ConvertModal lead={lead} onClose={() => setModal(null)} onConverted={clientId => { setModal(null); invalidateLead(qc, lead._id); onNavigate(`/clients/${clientId}`) }} />}
        {modal === 'lost' && <MarkLostModal lead={lead} onClose={() => setModal(null)} onDone={() => { setModal(null); invalidateLead(qc, lead._id) }} />}
      </AnimatePresence>
    </div>
  )
}
