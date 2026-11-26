import { useMemo, useState } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { CheckSquare, Clock, Info, LayoutTemplate, MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TemplateIcon } from '@/components/job-templates/TemplateIcon'
import { JobTemplateEditor } from '@/components/job-templates/JobTemplateEditor'
import {
  deleteJobTemplate, jobTemplatesQuery, templateErrorMessage, templateHours, templatePrice, type JobTemplate,
} from '@/utils/jobTemplates'

export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(jobTemplatesQuery)
  return null
}

function Stat({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-[var(--border)] text-xs text-foreground/80 bg-card">
      <Icon size={12} className="text-muted-foreground" /> {children}
    </span>
  )
}

function TemplateCard({ t, onEdit, onUse }: { t: JobTemplate; onEdit: () => void; onUse: () => void }) {
  const hours = templateHours(t)
  const price = templatePrice(t)
  const remove = async () => {
    if (!window.confirm(`Delete the “${t.name}” template? Jobs already made from it aren't affected.`)) return
    try { await deleteJobTemplate(t._id); toast.success('Template deleted') }
    catch (e) { toast.error(templateErrorMessage(e, "Couldn't delete the template.")) }
  }
  return (
    <article className="bg-card border border-[var(--border)] rounded-2xl p-5 flex flex-col gap-3.5 hover:border-slate-300 hover:shadow-sm transition">
      <div className="flex items-start gap-3">
        <TemplateIcon icon={t.icon} className="w-11 h-11" size={20} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[15px] truncate">{t.name}</h3>
          <p className="text-[13px] text-muted-foreground truncate">{t.summary || t.title}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={`Actions for ${t.name}`} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted -mr-1.5 -mt-1">
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={onEdit}><Pencil size={14} /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={remove} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 size={14} /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {hours && <Stat icon={Clock}>{hours} hour{hours === 1 ? '' : 's'}</Stat>}
        <Stat icon={Users}>{t.requiredWorkers} worker{t.requiredWorkers === 1 ? '' : 's'}</Stat>
        {price && <span className="inline-flex items-center h-7 px-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">{price}</span>}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckSquare size={12} />
        {t.checklist.length ? `${t.checklist.length} checklist item${t.checklist.length === 1 ? '' : 's'}` : 'No checklist'}
        {t.useCount > 0 && <span className="ml-auto">Used {t.useCount}×</span>}
      </p>

      <div className="flex items-center justify-end gap-2 pt-3 mt-auto border-t border-[var(--border)]/70">
        <button type="button" onClick={onEdit} className="h-9 px-3 rounded-lg text-sm font-semibold text-[var(--primary)] hover:bg-muted">Edit</button>
        <button type="button" onClick={onUse} className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold">Use template</button>
      </div>
    </article>
  )
}

export function JobTemplatesPage() {
  const navigate = useNavigate()
  const { data: templates = [] } = useQuery(jobTemplatesQuery)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<JobTemplate | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(t => [t.name, t.summary, t.title, t.description].some(s => s?.toLowerCase().includes(q)))
  }, [templates, search])

  const openEditor = (t: JobTemplate | null) => { setEditing(t); setEditorOpen(true) }
  const use = (t: JobTemplate) => navigate(`/create-job?template=${t._id}`)

  return (
    <div className="py-6 max-w-7xl mx-auto flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Job templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Save the details once. Pick the client, date and workers when you create a job.</p>
        </div>
        <button type="button" onClick={() => openEditor(null)}
          className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-bold rounded-xl flex items-center gap-2">
          <Plus size={14} /> New template
        </button>
      </div>

      {templates.length > 0 && (
        <div className="relative w-full sm:w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…" aria-label="Search templates"
            className="w-full h-9 pl-8 pr-3 border border-[var(--border)] rounded-xl text-sm bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15" />
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-card border border-[var(--border)] rounded-2xl py-14 px-8 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-2xl bg-[var(--primary)]/8 flex items-center justify-center mb-4"><LayoutTemplate size={22} className="text-[var(--primary)]" /></span>
          <h3 className="text-sm font-bold mb-1.5">No templates yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-5">
            Make one for each kind of job you do often, like a deep clean or an oven clean. Or open any job's ⋯ menu and choose
            <b className="text-foreground"> Save as template</b>.
          </p>
          <button type="button" onClick={() => openEditor(null)} className="h-9 px-5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl flex items-center gap-2">
            <Plus size={13} /> New template
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No templates match “{search}”.</p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => <TemplateCard key={t._id} t={t} onEdit={() => openEditor(t)} onUse={() => use(t)} />)}
        </div>
      )}

      {templates.length > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-900">
          <Info size={15} className="shrink-0" />
          Templates don't schedule anything. Dates, sites and workers are chosen when you use one.
        </p>
      )}

      <JobTemplateEditor open={editorOpen} onOpenChange={setEditorOpen} template={editing} />
    </div>
  )
}
