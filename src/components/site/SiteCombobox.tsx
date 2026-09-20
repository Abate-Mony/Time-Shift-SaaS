import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, X, MapPin, ShieldCheck } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import type { Site } from '@/utils/types/site'
import { Input } from '../ui/input'

export type ComboboxSite = Pick<Site, '_id' | 'name' | 'formattedAddress' | 'coordinates' | 'geofenceMode' | 'geofenceRadiusMeters'> & {
  contact?: Site['contact']
  accessInstructions?: string
  parkingInstructions?: string
}

function SiteResult({ site, onSelect }: { site: Site; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
    >
      <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/8 flex items-center justify-center shrink-0 mt-0.5">
        <MapPin size={12} className="text-[var(--primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate block">{site.name}</span>
        {site.formattedAddress && <p className="text-xs text-muted-foreground truncate">{site.formattedAddress}</p>}
      </div>
    </button>
  )
}

function SelectedSiteCard({ site, onClear }: { site: ComboboxSite; onClear: () => void }) {
  return (
    <div className="w-full border border-[var(--border)] rounded-xl p-3 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{site.name}</p>
          {site.formattedAddress && <p className="text-xs text-muted-foreground truncate mt-0.5">{site.formattedAddress}</p>}
          {site.geofenceMode && site.geofenceMode !== 'off' && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck size={11} /> {site.geofenceRadiusMeters ?? 150}m geofence
            </p>
          )}
        </div>
        <button type="button" onClick={onClear} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground shrink-0 transition-colors">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}

interface SiteComboboxProps {
  clientId: string
  value: ComboboxSite | null
  onChange: (site: ComboboxSite | null) => void
}

// Client-scoped — only ever shows active sites belonging to the currently
// selected client, per the create-job "existing site" flow.
export function SiteCombobox({ clientId, value, onChange }: SiteComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<Site[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!open || !clientId) return
    let cancelled = false
    setSearching(true)
    customFetch
      .get<{ sites: Site[] }>('/sites', { params: { client: clientId, search: debouncedQuery || undefined, status: 'active', limit: 20 } })
      .then(({ data }) => { if (!cancelled) setResults(data.sites) })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setSearching(false) })
    return () => { cancelled = true }
  }, [open, debouncedQuery, clientId])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (site: Site) => {
    onChange(site)
    setOpen(false)
    setQuery('')
  }

  if (value) {
    return <SelectedSiteCard site={value} onClear={() => onChange(null)} />
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 border border-[var(--border)] rounded-xl bg-card text-sm text-muted-foreground hover:border-slate-300 transition-colors"
      >
        <span>Search or select a site…</span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-12 z-50 bg-card border border-[var(--border)] rounded-xl shadow-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search sites…"
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none bg-transparent"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-muted-foreground transition-colors">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="max-h-[220px] overflow-y-auto py-1">
              {searching ? (
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Searching…</p>
                </div>
              ) : results.length > 0 ? (
                results.map(site => (
                  <SiteResult key={site._id} site={site} onSelect={() => handleSelect(site)} />
                ))
              ) : (
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">No sites found for this client.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
