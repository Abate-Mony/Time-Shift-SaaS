import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFilter } from '@/hooks/CustomLinkFilterHook'
import { cn } from '@/lib/utils'

/**
 * One chip's worth of config. A bare string is the common case — pass
 * `"status"` and it becomes its own chip, labeled "Status", showing
 * whatever raw value is in the URL. Pass an object when a chip needs more
 * than that: several keys folded into one chip (a date range), a nicer
 * label, or a formatter to turn an id into the name a user actually
 * recognizes (only the page knows how to resolve that, so it's the one
 * place this component can't guess for itself).
 */
export interface ActiveFilterEntry {
  /** One key, or several folded into a single chip (e.g. ["start", "end"]). */
  keys: string | string[]
  /** Defaults to the (first) key, split on camelCase and capitalized. */
  label?: string
  /** Defaults to joining every non-empty value with " – ". */
  format?: (values: (string | null)[]) => string
  /** Defaults to "at least one value is set". Override when a value like
   *  "all" is a real, present URL param but represents no filter at all
   *  (e.g. a tab bar that writes status=all for its default tab). */
  isActive?: (values: (string | null)[]) => boolean
}

export type ActiveFilterSpec = string | ActiveFilterEntry

interface ActiveFiltersBarProps {
  /** Search-param keys (or grouped entries) this bar watches and can clear. */
  filters: ActiveFilterSpec[]
  className?: string
}

const toEntry = (spec: ActiveFilterSpec): ActiveFilterEntry =>
  typeof spec === 'string' ? { keys: spec } : spec

const defaultLabel = (key: string) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())

const defaultFormat = (values: (string | null)[]) =>
  values.filter((v): v is string => !!v).join(' – ')

export function ActiveFiltersBar({ filters, className }: ActiveFiltersBarProps) {
  const { searchQuery, handleFiltersChange } = useFilter()

  const active = filters
    .map(toEntry)
    .map(entry => {
      const keys = Array.isArray(entry.keys) ? entry.keys : [entry.keys]
      const values = keys.map(k => searchQuery.get(k))
      const isActive = entry.isActive ?? (vs => vs.some(Boolean))
      if (!isActive(values)) return null
      return {
        id: keys.join('+'),
        keys,
        label: entry.label ?? defaultLabel(keys[0]),
        display: (entry.format ?? defaultFormat)(values),
      }
    })
    .filter((v): v is NonNullable<typeof v> => v !== null)

  if (active.length === 0) return null

  const clear = (keys: string[]) => {
    handleFiltersChange(Object.fromEntries(keys.map(k => [k, null])))
  }

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <AnimatePresence initial={false}>
        {active.map(f => (
          <motion.span
            key={f.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-[#1E3A5F]/8 border border-[#1E3A5F]/10 text-xs font-medium text-[#1E3A5F] max-w-full"
          >
            <span className="text-[#1E3A5F]/55 shrink-0">{f.label}:</span>
            <span className="font-semibold truncate">{f.display}</span>
            <button
              type="button"
              onClick={() => clear(f.keys)}
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 hover:bg-[#1E3A5F]/15 transition-colors"
              aria-label={`Clear ${f.label} filter`}
            >
              <X size={10} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      {active.length > 1 && (
        <button
          type="button"
          onClick={() => clear(active.flatMap(f => f.keys))}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors shrink-0"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
