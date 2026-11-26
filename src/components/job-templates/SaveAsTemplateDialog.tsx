import { useEffect, useState } from "react"
import { Link } from "react-router"
import toast from "react-hot-toast"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { saveJobAsTemplate, templateErrorMessage, TEMPLATE_ICONS, type TemplateIcon } from "@/utils/jobTemplates"
import { TEMPLATE_ICON_MAP } from "./TemplateIcon"

/** "Save as template" from an existing job: just a name and an icon. */
export function SaveAsTemplateDialog({
  jobId, jobTitle, open, onOpenChange,
}: {
  jobId: string
  jobTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(jobTitle)
  const [icon, setIcon] = useState<TemplateIcon>("sparkles")
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) { setName(jobTitle.replace(/\s*\(Copy\)$/i, "")); setIcon("sparkles") } }, [open, jobTitle])

  const save = async () => {
    if (!name.trim()) { toast.error("Give the template a name."); return }
    setSaving(true)
    try {
      await saveJobAsTemplate(jobId, { name: name.trim(), icon })
      toast.success(t => (
        <span>
          Saved “{name.trim()}” as a template.{" "}
          <Link to="/jobs/templates" onClick={() => toast.dismiss(t.id)} className="font-semibold underline">View templates</Link>
        </span>
      ))
      onOpenChange(false)
    } catch (e) {
      toast.error(templateErrorMessage(e, "Couldn't save the template."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Save as template</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Copies the title, description, usual times, workers needed, pay and price, instructions and checklist.
            Not the client, site, date or workers.
          </p>
        </DialogHeader>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground/80">Template name</span>
          <input
            autoFocus
            value={name}
            maxLength={80}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save() }}
            className="h-10 px-3 rounded-lg border border-[var(--border)] bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_ICONS.map(key => {
            const { icon: Icon, label, tint } = TEMPLATE_ICON_MAP[key]
            return (
              <button key={key} type="button" title={label} aria-label={label} aria-pressed={icon === key} onClick={() => setIcon(key)}
                className={cn("w-9 h-9 rounded-lg flex items-center justify-center border-2", tint, icon === key ? "border-[var(--primary)]" : "border-transparent opacity-70 hover:opacity-100")}>
                <Icon size={15} />
              </button>
            )
          })}
        </div>
        <DialogFooter className="gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="h-9 px-4 rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-50">
            {saving ? "Saving…" : "Save template"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
