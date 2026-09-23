import { AnimatePresence, motion } from "framer-motion"
import { ListChecks, MapPin, Paperclip, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { useCreateJob } from "../CreateJobContext"
import { FieldError } from "../FieldError"
import { Label } from "@/components/ui/label"
import { useFieldArray } from "react-hook-form"

const GEOFENCE_MODES = [
  { value: "", label: "Use company default", sub: "Whatever's set in Settings — recommended" },
  { value: "off", label: "No location check", sub: "Workers clock in from anywhere, nothing recorded" },
  { value: "warn", label: "Record and flag", sub: "Always lets them clock in, but flags it if they're off site" },
  { value: "enforce", label: "Require them on site", sub: "Blocks clock-in outside the radius — they'll need you to override it" },
] as const

export function PoliciesStep() {
  const { form } = useCreateJob()
  const { register, setValue, watch, control, formState: { errors } } = form

  const coordinates = watch("coordinates")
  const geofenceMode = watch("geofenceMode")

  const { fields: checklistFields, append: appendChecklistItem, remove: removeChecklistItem } = useFieldArray({
    control,
    name: "checklist",
  })

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Worker-visible instructions */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-1">Instructions for workers</h2>
        <p className="text-[11px] text-muted-foreground mb-3">
          Anyone assigned to this job will see this.
        </p>

        <Textarea
          {...register("instructions")}
          placeholder="Gate code, where to park, who to ask for..."
          rows={4}
          className={cn(errors.instructions && "border-red-500!")}
        />
        <FieldError message={errors.instructions?.message as string} />

        <button
          type="button"
          className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-slate-300 rounded-lg w-full py-3 px-4 hover:bg-muted transition-colors min-w-0"
        >
          <Paperclip size={14} className="shrink-0" />
          <span className="truncate">Attach files, documents or images</span>
        </button>
      </div>

      {/* Checklist — optional on-site task list workers tick off as they
          go (e.g. "Clean oven", "Wash client plates"). Shared across every
          worker assigned, not per-worker. */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <ListChecks size={15} className="text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold text-foreground">Checklist</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Optional. Tasks workers can check off on-site — everyone assigned shares the same list.
        </p>

        <div className="flex flex-col gap-2 min-w-0">
          {checklistFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 min-w-0">
              <Input
                {...register(`checklist.${index}.text` as const)}
                placeholder="e.g. Clean the oven"
                className="flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(index)}
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <FieldError message={(errors.checklist as any)?.message ?? (errors.checklist as any)?.root?.message} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => appendChecklistItem({ text: "", done: false })}
        >
          <Plus size={13} /> Add item
        </Button>
      </div>

      {/* Internal notes */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-1">Internal notes</h2>
        <p className="text-[11px] text-muted-foreground mb-3">Never shown to workers.</p>

        <Textarea
          {...register("notes")}
          placeholder="Anything the team should know but workers shouldn't see..."
          rows={3}
        />
      </div>

      {/* Clock-in policy */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-4">Clock-in policy</h2>

        <div className="max-w-xs min-w-0 mb-6">
          <Input
            label="Grace period"
            type="number"
            min="0"
            max="240"
            // defaultValue={30}
            placeholder="e.g. 30"
            {...register("clockInGraceMinutes", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}

          />
          <p className="text-[11px] text-muted-foreground mt-1">
            How early a worker can clock in, in minutes. Leave blank to use your company setting.
          </p>
          <FieldError message={errors.clockInGraceMinutes?.message as string} />
        </div>

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Location check
        </p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Overrides your company setting for this job only. Useful for sites with poor signal, or
          where workers move around a large area.
        </p>

        <div className="flex flex-col gap-2 min-w-0">
          {GEOFENCE_MODES.map(opt => {
            const active = (geofenceMode ?? "") === opt.value
            return (
              <Label
                key={opt.value}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0",
                  active ? "border-[var(--primary)] bg-[var(--primary)]/[0.03]" : "border-[var(--border)] hover:border-slate-300"
                )}
              >
                <Input
                  type="radio"
                  name="geofenceModeChoice"
                  className="sr-only"
                  checked={active}
                  onChange={() =>
                    setValue(
                      "geofenceMode",
                      opt.value === "" ? undefined : (opt.value as "off" | "warn" | "enforce"),
                      { shouldValidate: true }
                    )
                  }
                />
                <span
                  className={cn(
                    "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    active ? "border-[var(--primary)] bg-[var(--primary)]" : "border-slate-300"
                  )}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{opt.sub}</span>
                </span>
              </Label>
            )
          })}
        </div>

        <AnimatePresence initial={false}>
          {geofenceMode && geofenceMode !== "off" && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
              className="min-w-0"
            >
              <div className="mt-4 max-w-xs min-w-0">
                <Input
                  label="Radius"
                  type="number"
                  min="25"
                  max="5000"
                  step="25"
                  placeholder="150"
                  icon={<MapPin size={13} />}
                  {...register("geofenceRadiusMeters", { valueAsNumber: true })}
                  className={cn(errors.geofenceRadiusMeters && "border-red-500!")}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Metres from the site. Phone GPS is often 50–100m out indoors, so anything under
                  100m will flag people who are genuinely there.
                </p>
                <FieldError message={errors.geofenceRadiusMeters?.message as string} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!coordinates && geofenceMode && geofenceMode !== "off" && (
          <p className="mt-3 text-xs text-amber-600">
            Pick a location on step 1 first — without map coordinates there's nothing to measure
            against, so this won't do anything.
          </p>
        )}
      </div>
    </div>
  )
}
