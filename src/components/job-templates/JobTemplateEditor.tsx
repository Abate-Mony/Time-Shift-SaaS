import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Plus, X } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  emptyTemplate, saveJobTemplate, templateErrorMessage, TEMPLATE_ICONS,
  type JobTemplate, type JobTemplateInput,
} from "@/utils/jobTemplates"
import { TEMPLATE_ICON_MAP } from "./TemplateIcon"

const field = "w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40"
const area = "w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 resize-y"

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline gap-2 text-xs font-semibold text-foreground/80 mb-1.5">
      {children}
      {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
      {children}
    </section>
  )
}

// Copy only the editable fields — the server also returns company,
// createdBy, timestamps etc., which must not be sent back.
const fromTemplate = (t?: JobTemplate | null): JobTemplateInput => {
  const base = emptyTemplate()
  if (!t) return base
  const picked = Object.fromEntries(
    (Object.keys(base) as (keyof JobTemplateInput)[]).map(k => [k, t[k] ?? base[k]])
  ) as JobTemplateInput
  return { ...picked, checklist: (t.checklist ?? []).map(c => ({ text: c.text })) }
}

/** Create or edit a template. `template` null = new. */
export function JobTemplateEditor({
  open, onOpenChange, template,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: JobTemplate | null
}) {
  const [v, setV] = useState<JobTemplateInput>(() => fromTemplate(template))
  const [newItem, setNewItem] = useState("")
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) { setV(fromTemplate(template)); setNewItem("") } }, [open, template])

  const set = <K extends keyof JobTemplateInput>(k: K, value: JobTemplateInput[K]) => setV(prev => ({ ...prev, [k]: value }))
  const num = (s: string) => (s === "" ? 0 : Number(s))

  const addItem = () => {
    const text = newItem.trim()
    if (!text) return
    set("checklist", [...v.checklist, { text }])
    setNewItem("")
  }

  const problem =
    !v.name.trim() ? "Give the template a name."
      : !v.title.trim() ? "Add the job title it should fill in."
        : !!v.startTime !== !!v.endTime ? "Set both usual times, or leave both empty."
          : v.startTime && v.startTime === v.endTime ? "Start and finish time can't be the same."
            : null

  const save = async () => {
    if (problem) { toast.error(problem); return }
    setSaving(true)
    try {
      // A half-typed checklist item still counts.
      const checklist = newItem.trim() ? [...v.checklist, { text: newItem.trim() }] : v.checklist
      await saveJobTemplate({ ...v, checklist }, template?._id)
      toast.success(template ? "Template saved" : "Template created")
      onOpenChange(false)
    } catch (e) {
      toast.error(templateErrorMessage(e, "Couldn't save the template."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? `Edit “${template.name}”` : "New job template"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            The details that repeat for this kind of job. Client, site, date and workers are picked each time.
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-1">
          <Section title="Template">
            <div className="grid sm:grid-cols-2 gap-3">
              <label>
                <Label>Name</Label>
                <input className={field} value={v.name} maxLength={80} placeholder="e.g. Deep clean" autoFocus
                  onChange={e => { set("name", e.target.value); if (!template && (!v.title || v.title === v.name)) set("title", e.target.value) }} />
              </label>
              <label>
                <Label hint="optional">Short description</Label>
                <input className={field} value={v.summary} maxLength={140} placeholder="e.g. Kitchens, bathrooms and floors" onChange={e => set("summary", e.target.value)} />
              </label>
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_ICONS.map(key => {
                  const { icon: Icon, label, tint } = TEMPLATE_ICON_MAP[key]
                  return (
                    <button key={key} type="button" title={label} aria-label={label} aria-pressed={v.icon === key}
                      onClick={() => set("icon", key)}
                      className={cn("w-10 h-10 rounded-xl flex items-center justify-center border-2 transition", tint,
                        v.icon === key ? "border-[var(--primary)]" : "border-transparent opacity-70 hover:opacity-100")}>
                      <Icon size={17} />
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>

          <Section title="Job details it fills in">
            <label>
              <Label>Job title</Label>
              <input className={field} value={v.title} maxLength={200} onChange={e => set("title", e.target.value)} />
            </label>
            <label>
              <Label hint="optional">Description</Label>
              <textarea className={area} rows={3} value={v.description} onChange={e => set("description", e.target.value)} />
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label>
                <Label hint="optional">Usual start</Label>
                <input type="time" className={field} value={v.startTime} onChange={e => set("startTime", e.target.value)} />
              </label>
              <label>
                <Label hint="optional">Usual finish</Label>
                <input type="time" className={field} value={v.endTime} onChange={e => set("endTime", e.target.value)} />
              </label>
              <label>
                <Label>Workers needed</Label>
                <input type="number" min={1} max={50} className={field} value={v.requiredWorkers}
                  onChange={e => set("requiredWorkers", Math.max(1, Math.min(50, num(e.target.value) || 1)))} />
              </label>
              <div>
                <Label>Priority</Label>
                <Select value={v.priority} onValueChange={p => set("priority", p as JobTemplateInput["priority"])}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p} className="capitalize">{p[0].toUpperCase() + p.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          <Section title="Pay & price">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>Charge the client</Label>
                <Select value={v.chargeType} onValueChange={c => set("chargeType", c as "hourly" | "fixed")}>
                  <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Per hour, per worker</SelectItem>
                    <SelectItem value="fixed">Fixed price per job</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label>
                <Label>{v.chargeType === "hourly" ? "Charge rate (£/h)" : "Price (£)"}</Label>
                <input type="number" min={0} step="0.01" className={field}
                  value={v.chargeType === "hourly" ? v.chargeRate || "" : v.chargeAmount || ""} placeholder="0.00"
                  onChange={e => set(v.chargeType === "hourly" ? "chargeRate" : "chargeAmount", num(e.target.value))} />
              </label>
              <label>
                <Label>Pay rate (£/h)</Label>
                <input type="number" min={0} step="0.01" className={field} value={v.payRate || ""} placeholder="Company default"
                  onChange={e => set("payRate", num(e.target.value))} />
              </label>
            </div>
          </Section>

          <Section title="For the workers">
            <label>
              <Label hint="optional">Instructions</Label>
              <textarea className={area} rows={2} value={v.instructions} placeholder="e.g. Bring the steam cleaner and limescale kit"
                onChange={e => set("instructions", e.target.value)} />
            </label>
            <div>
              <Label hint={v.checklist.length ? `${v.checklist.length} item${v.checklist.length === 1 ? "" : "s"}` : "optional"}>Checklist</Label>
              {v.checklist.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2">
                  {v.checklist.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />
                      <input className={cn(field, "h-9")} value={item.text} maxLength={200}
                        onChange={e => set("checklist", v.checklist.map((c, j) => (j === i ? { text: e.target.value } : c)))} />
                      <button type="button" aria-label="Remove item" onClick={() => set("checklist", v.checklist.filter((_, j) => j !== i))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted shrink-0"><X size={14} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input className={cn(field, "h-9")} value={newItem} maxLength={200} placeholder="Add an item, e.g. Inside oven & microwave"
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem() } }} />
                <button type="button" onClick={addItem} disabled={!newItem.trim()}
                  className="h-9 px-3 rounded-lg border border-[var(--border)] text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-40 hover:bg-muted shrink-0">
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
            <label>
              <Label hint="optional · only managers see these">Internal notes</Label>
              <textarea className={area} rows={2} value={v.notes} onChange={e => set("notes", e.target.value)} />
            </label>
            <div className="flex flex-col gap-2.5 rounded-lg border border-[var(--border)] p-3">
              {([
                ["openToClaims", "Open to claims", "Lets any worker claim an unfilled slot on this shift."],
                ["requiresApproval", "Require approval", "You approve each claim before the shift is theirs."],
                ["autoAccept", "Auto-accept", "Assigned workers don't need to accept — it's confirmed on their schedule right away."],
              ] as const).filter(([key]) => key !== "requiresApproval" || v.openToClaims).map(([key, label, hint]) => (
                <label key={key} className="flex items-center justify-between gap-4 cursor-pointer">
                  <span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{hint}</span></span>
                  <Switch checked={v[key]} onCheckedChange={c => set(key, !!c)} />
                </label>
              ))}
            </div>
          </Section>
        </div>

        <DialogFooter className="gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-9 px-4 rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="button" onClick={save} disabled={saving}
            className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : template ? "Save template" : "Create template"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
