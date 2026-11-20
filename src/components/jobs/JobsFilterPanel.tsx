import { useQuery } from "@tanstack/react-query"
import { Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { clientsQuery } from "@/utils/clients"
import { sitesQuery } from "@/utils/sites"
import { companyWorkersQuery, FILTER_PANEL_KEYS } from "@/utils/jobsList"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  )
}

/**
 * Client, site, worker, priority and staffing filters, behind one "Filter"
 * button. Every value is a URL param; `onChange` writes them (and resets
 * the page) through the page's useFilter.
 */
export function JobsFilterPanel({
  values, onChange, open, onOpenChange,
}: {
  values: Record<(typeof FILTER_PANEL_KEYS)[number], string>
  onChange: (entries: Record<string, string | null>) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const activeCount = FILTER_PANEL_KEYS.filter(k => values[k] && values[k] !== "false").length
  // Fetched lazily — only once the panel opens, or a filter needing a name
  // for its chip is already set on load.
  const { data: clients } = useQuery({ ...clientsQuery(), enabled: open || !!values.client })
  const { data: sites } = useQuery({
    ...sitesQuery(values.client ? { client: values.client } : {}),
    enabled: open || !!values.site,
  })
  const { data: workers } = useQuery({ ...companyWorkersQuery, enabled: open || !!values.worker })

  const select = (key: string, value: string, placeholder: string, items: { value: string; label: string }[]) => (
    <Select value={value || "all"} onValueChange={v => onChange({ [key]: v === "all" ? null : v })}>
      <SelectTrigger className={cn("h-9 w-full", value && "border-[var(--primary)] bg-[var(--primary)]/5")}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="all">{placeholder}</SelectItem>
        {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 h-9 px-3 border rounded-lg text-sm font-medium bg-card hover:bg-muted transition-colors",
            activeCount > 0 ? "border-[var(--primary)] text-[var(--primary)]" : "border-[var(--border)] text-muted-foreground"
          )}
        >
          <Filter size={13} /> Filter
          {activeCount > 0 && (
            <span className="min-w-4 h-4 px-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 flex flex-col gap-4">
        <Field label="Client">
          {select("client", values.client, "Any client", (clients?.clients ?? []).map(c => ({ value: c._id, label: c.name })))}
        </Field>
        <Field label="Site">
          {select("site", values.site, values.client ? "Any of this client's sites" : "Any site",
            (sites?.sites ?? []).map((s: { _id: string; name: string }) => ({ value: s._id, label: s.name })))}
        </Field>
        <Field label="Worker">
          {select("worker", values.worker, "Anyone", (workers ?? []).map(w => ({ value: w._id, label: w.fullname || w.email })))}
        </Field>
        <Field label="Priority">
          {select("priority", values.priority, "Any priority", [
            { value: "low", label: "Low" }, { value: "medium", label: "Medium" },
            { value: "high", label: "High" }, { value: "urgent", label: "Urgent" },
          ])}
        </Field>
        <Field label="Staffing">
          <Label className="flex items-center gap-2 cursor-pointer font-normal text-sm">
            <Checkbox checked={values.unfilled === "true"} onCheckedChange={c => onChange({ unfilled: c ? "true" : null })} />
            Has unfilled places
          </Label>
          <Label className="flex items-center gap-2 cursor-pointer font-normal text-sm">
            <Checkbox checked={values.unassigned === "true"} onCheckedChange={c => onChange({ unassigned: c ? "true" : null })} />
            No workers assigned at all
          </Label>
        </Field>
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-xs">
          <button
            type="button"
            disabled={!activeCount}
            onClick={() => onChange(Object.fromEntries(FILTER_PANEL_KEYS.map(k => [k, null])))}
            className="font-semibold text-[var(--primary)] disabled:text-muted-foreground disabled:opacity-60"
          >
            Clear filters
          </button>
          <span className="text-muted-foreground">Applies as you change it</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
