import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, X, Plus, AlertTriangle, RefreshCw } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { findClientByExactName, isDuplicateClientError } from '@/utils/clients'
import type { Client } from '@/utils/types/client'

// A job's populated client (JobClientRef, from @/utils/types) is a subset
// of the full Client doc — no paymentTermsDays, no formattedAddress. This
// is the minimal shape everything in this file actually reads, so both a
// fresh search result and a job's already-attached client satisfy it.
export type ComboboxClient = Pick<Client, '_id' | 'name'> & {
  status?: Client['status']
  primaryContact?: Client['primaryContact']
  defaultChargeType?: Client['defaultChargeType']
  defaultChargeRate?: number
  paymentTermsDays?: number
  formattedAddress?: string
}

// ─── Quick Create mini-form ───────────────────────────────────────────────────

function QuickCreateClient({
  prefill,
  onCreated,
  onClose,
}: {
  prefill: string
  onCreated: (client: Client) => void
  onClose: () => void
}) {
  const [name, setName] = useState(prefill)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<Client | null>(null)

  const handleCreate = async () => {
    setLoading(true)
    setErrorMsg(null)
    setDuplicate(null)
    try {
      const { data } = await customFetch.post<{ client: Client }>('/clients', {
        name: name.trim(),
        contacts: contactName.trim()
          ? [{ name: contactName.trim(), email: contactEmail.trim() || undefined, phone: phone.trim() || undefined, isPrimary: true }]
          : undefined,
        phone: phone.trim() || undefined,
        billingEmail: (billingEmail || contactEmail).trim() || undefined,
      })
      onCreated(data.client)
    } catch (err: any) {
      const msg: string | undefined = err.response?.data?.msg
      if (isDuplicateClientError(msg)) {
        const existing = await findClientByExactName(name.trim())
        if (existing) setDuplicate(existing)
        else setErrorMsg(msg ?? 'Failed to create client.')
      } else {
        setErrorMsg(msg ?? 'Failed to create client.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Add new client</h3>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Client name <span className="text-red-400">*</span></label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Security"
            className="w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Primary contact name</label>
          <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Smith"
            className="w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Primary contact email</label>
          <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="jane@acmesecurity.co.uk" type="email"
            className="w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="07700 900123"
              className="w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Billing email</label>
            <input value={billingEmail} onChange={e => setBillingEmail(e.target.value)} placeholder="accounts@…"
              className="w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all" />
          </div>
        </div>
      </div>
      {duplicate ? (
        <div className="flex flex-col gap-2 mt-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-800 leading-relaxed">
            A client named <span className="font-semibold">{duplicate.name}</span> already exists.
          </p>
          <button
            onClick={() => onCreated(duplicate)}
            className="self-start h-7 px-3 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
          >
            Use existing client
          </button>
        </div>
      ) : errorMsg ? (
        <div className="flex items-start gap-2 mt-3 p-2.5 bg-red-50 border border-red-100 rounded-lg">
          <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{errorMsg}</p>
        </div>
      ) : null}
      <div className="flex gap-2.5 mt-4">
        <button onClick={onClose} className="h-9 px-4 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="flex-1 h-9 text-sm font-bold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#162D4A] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Create client</>
          )}
        </button>
      </div>
    </div>
  )
}

// ─── Client result row ────────────────────────────────────────────────────────

function ClientResult({ client, onSelect }: { client: Client; onSelect: () => void }) {
  const isInactive = client.status === 'inactive'
  return (
    <button
      onClick={onSelect}
      disabled={isInactive}
      className={`w-full flex items-start gap-3 px-3 py-2.5 transition-colors text-left ${isInactive ? 'opacity-60 cursor-default' : 'hover:bg-slate-50'}`}
    >
      <div className="w-7 h-7 rounded-lg bg-[#1E3A5F]/8 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[#1E3A5F]">{client.name.slice(0, 2).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 truncate">{client.name}</span>
          {isInactive && (
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Inactive</span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate">
          {[client.primaryContact?.name, client.formattedAddress].filter(Boolean).join(' · ')}
        </p>
        {isInactive && (
          <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
            <RefreshCw size={10} />
            <span>Reactivate this client first</span>
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Selected client card ─────────────────────────────────────────────────────

function SelectedClientCard({ client, onClear }: { client: ComboboxClient; onClear: () => void }) {
  return (
    <div className="w-full border border-[#E2E8F0] rounded-xl p-3 bg-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{client.name}</p>
          {client.primaryContact && (
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {client.primaryContact.name}{client.primaryContact.email ? ` · ${client.primaryContact.email}` : ''}
            </p>
          )}
          {!!client.defaultChargeRate && client.defaultChargeRate > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              Default charge: £{client.defaultChargeRate.toFixed(2)}{client.defaultChargeType === 'hourly' ? '/hour' : ''}
              {client.paymentTermsDays != null ? ` · ${client.paymentTermsDays} day terms` : ''}
            </p>
          )}
        </div>
        <button onClick={onClear} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 shrink-0 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Apply rate prompt ────────────────────────────────────────────────────────

export function ApplyRatePrompt({
  client,
  currentRate,
  onKeep,
  onApply,
}: {
  client: ComboboxClient
  currentRate: number
  onKeep: () => void
  onApply: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3"
    >
      <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-amber-900 mb-1">Apply this client's default rate?</p>
        <p className="text-xs text-amber-700">The job currently has a custom charge rate (£{currentRate.toFixed(2)}/hr).</p>
        <div className="flex items-center gap-2 mt-2.5">
          <button onClick={onKeep} className="h-7 px-3 text-xs font-semibold text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors">Keep current rate</button>
          <button onClick={onApply} className="h-7 px-3 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors">
            Use £{(client.defaultChargeRate ?? 0).toFixed(2)}/{client.defaultChargeType === 'hourly' ? 'hr' : 'fixed'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main combobox ────────────────────────────────────────────────────────────

interface ClientComboboxProps {
  value: ComboboxClient | null
  onChange: (client: ComboboxClient | null) => void
  onToast?: (msg: string) => void
}

export function ClientCombobox({ value, onChange, onToast }: ClientComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [results, setResults] = useState<Client[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce keystrokes before hitting the API — this is the same endpoint
  // the Clients management page uses, just always scoped to active clients.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setSearching(true)
    customFetch
      .get<{ clients: Client[] }>('/clients', { params: { search: debouncedQuery || undefined, status: 'active', limit: 8 } })
      .then(({ data }) => { if (!cancelled) setResults(data.clients) })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setSearching(false) })
    return () => { cancelled = true }
  }, [open, debouncedQuery])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowQuickCreate(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (client: Client) => {
    onChange(client)
    setOpen(false)
    setQuery('')
    setShowQuickCreate(false)
  }

  const handleQuickCreate = (client: Client) => {
    onChange(client)
    setOpen(false)
    setQuery('')
    setShowQuickCreate(false)
    onToast?.(`${client.name} created and selected.`)
  }

  if (value) {
    return <SelectedClientCard client={value} onClear={() => onChange(null)} />
  }

  return (
    <div ref={containerRef} className="relative">
      <button
      type='button'
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 border border-[#E2E8F0] rounded-xl bg-white text-sm text-slate-400 hover:border-slate-300 transition-colors"
      >
        <span>Search or select a client…</span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-12 z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden"
          >
            {showQuickCreate ? (
              <QuickCreateClient
                prefill={query}
                onCreated={handleQuickCreate}
                onClose={() => { setShowQuickCreate(false) }}
              />
            ) : (
              <>
                {/* Search input */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E2E8F0]">
                  <Search size={13} className="text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search clients…"
                    className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  {query && (
                    <button
      type='button'
                      onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-[220px] overflow-y-auto py-1">
                  {searching ? (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-slate-400">Searching…</p>
                    </div>
                  ) : results.length > 0 ? (
                    results.map(client => (
                      <ClientResult key={client._id} client={client} onSelect={() => handleSelect(client)} />
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center">
                      <p className="text-xs text-slate-500 mb-2">No clients found for "{query}"</p>
                    </div>
                  )}
                </div>

                {/* No match CTA */}
                {query && (
                  <div className="border-t border-[#E2E8F0] px-3 py-2">
                    <button
      type='button'

                      onClick={() => setShowQuickCreate(true)}
                      className="w-full flex items-center gap-2 py-2 px-1 text-sm font-semibold text-[#1E3A5F] hover:text-[#162D4A] transition-colors"
                    >
                      <Plus size={13} /> Create "{query}"
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
