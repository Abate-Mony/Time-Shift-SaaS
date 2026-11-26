import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { jobTemplatesQuery, templateMeta, type JobTemplate } from "@/utils/jobTemplates"
import { TemplateIcon } from "./TemplateIcon"

const VISIBLE = 5

function Tile({ t, active, onPick }: { t: JobTemplate; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition min-w-0",
        active ? "border-2 border-[var(--primary)] bg-[var(--primary)]/[0.04] px-[11px] py-[9px]" : "border border-[var(--border)] bg-card hover:border-slate-300 hover:bg-muted/40"
      )}
    >
      <TemplateIcon icon={t.icon} className="w-9 h-9 rounded-lg" size={16} />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-bold truncate">{t.name}</span>
        <span className="block text-[11.5px] text-muted-foreground truncate">{templateMeta(t)}</span>
      </span>
    </button>
  )
}

/**
 * "Start from a template" on Create Job step 1. The most-used templates as
 * one-click tiles; the rest (and search) in a popover.
 */
export function TemplatePicker({ activeId, onPick }: { activeId: string | null; onPick: (t: JobTemplate) => void }) {
  const { data: templates, isLoading } = useQuery(jobTemplatesQuery)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")

  const list = useMemo(() => templates ?? [], [templates])
  // Keep the picked one visible even if it isn't in the top five.
  const visible = useMemo(() => {
    const top = list.slice(0, VISIBLE)
    const active = list.find(t => t._id === activeId)
    return active && !top.includes(active) ? [...top.slice(0, VISIBLE - 1), active] : top
  }, [list, activeId])
  const matches = list.filter(t => !q.trim() || [t.name, t.summary, t.title].some(s => s?.toLowerCase().includes(q.trim().toLowerCase())))

  if (isLoading) return null

  if (!list.length) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-[var(--border)] bg-card px-4 py-3 flex items-center gap-3 flex-wrap text-sm">
        <span className="font-semibold">Start from a template</span>
        <span className="text-muted-foreground">Save your usual jobs (deep clean, oven clean…) once and fill this form in one click.</span>
        <Link to="/jobs/templates" className="ml-auto font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1">
          Create a template <ArrowRight size={13} />
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--border)] bg-card p-4 min-w-0">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="font-bold text-[15px]">Start from a template</span>
        <span className="text-sm text-muted-foreground">or skip this and fill the form yourself</span>
        <Link to="/jobs/templates" className="ml-auto text-xs font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1">
          Manage templates <ArrowRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {visible.map(t => <Tile key={t._id} t={t} active={t._id === activeId} onPick={() => onPick(t)} />)}
        <Popover open={open} onOpenChange={o => { setOpen(o); if (!o) setQ("") }}>
          <PopoverTrigger asChild>
            <button type="button" className="rounded-xl border border-dashed border-[var(--border)] px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground inline-flex items-center justify-center gap-1.5">
              <Search size={13} /> {list.length > visible.length ? `All ${list.length} templates` : "Search"}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search templates…" aria-label="Search templates"
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-[var(--border)] text-sm bg-card focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15" />
            </div>
            <ul className="max-h-72 overflow-y-auto flex flex-col">
              {matches.map(t => (
                <li key={t._id}>
                  <button type="button" onClick={() => { onPick(t); setOpen(false) }}
                    className={cn("w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted", t._id === activeId && "bg-muted")}>
                    <TemplateIcon icon={t.icon} className="w-8 h-8 rounded-lg" size={14} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{t.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{templateMeta(t)}</span>
                    </span>
                  </button>
                </li>
              ))}
              {!matches.length && <li className="px-2 py-3 text-sm text-muted-foreground">No templates match “{q}”.</li>}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
