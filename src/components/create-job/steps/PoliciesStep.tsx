import { AnimatePresence, motion } from "framer-motion"
import { MapPin, Paperclip } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { useCreateJob } from "../CreateJobContext"
import { FieldError } from "../FieldError"

const GEOFENCE_MODES = [
  { value: "", label: "Use company default", sub: "Whatever's set in Settings — recommended" },
  { value: "off", label: "No location check", sub: "Workers clock in from anywhere, nothing recorded" },
  { value: "warn", label: "Record and flag", sub: "Always lets them clock in, but flags it if they're off site" },
  { value: "enforce", label: "Require them on site", sub: "Blocks clock-in outside the radius — they'll need you to override it" },
] as const

export function PoliciesStep() {
  const { form } = useCreateJob()
  const { register, setValue, watch, formState: { errors } } = form

  const coordinates = watch("coordinates")
  const geofenceMode = watch("geofenceMode")

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Worker-visible instructions */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Instructions for workers</h2>
        <p className="text-[11px] text-slate-400 mb-3">
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
          className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-lg w-full py-3 px-4 hover:bg-slate-50 transition-colors min-w-0"
        >
          <Paperclip size={14} className="shrink-0" />
          <span className="truncate">Attach files, documents or images</span>
        </button>
      </div>

      {/* Internal notes */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">Internal notes</h2>
        <p className="text-[11px] text-slate-400 mb-3">Never shown to workers.</p>

        <Textarea
          {...register("notes")}
          placeholder="Anything the team should know but workers shouldn't see..."
          rows={3}
        />
      </div>

      {/* Clock-in policy */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Clock-in policy</h2>

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
          <p className="text-[11px] text-slate-400 mt-1">
            How early a worker can clock in, in minutes. Leave blank to use your company setting.
          </p>
          <FieldError message={errors.clockInGraceMinutes?.message as string} />
        </div>

        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
          Location check
        </p>
        <p className="text-[11px] text-slate-400 mb-3">
          Overrides your company setting for this job only. Useful for sites with poor signal, or
          where workers move around a large area.
        </p>

        <div className="flex flex-col gap-2 min-w-0">
          {GEOFENCE_MODES.map(opt => {
            const active = (geofenceMode ?? "") === opt.value
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all min-w-0",
                  active ? "border-[#1E3A5F] bg-[#1E3A5F]/[0.03]" : "border-[#E2E8F0] hover:border-slate-300"
                )}
              >
                <input
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
                    active ? "border-[#1E3A5F] bg-[#1E3A5F]" : "border-slate-300"
                  )}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{opt.sub}</span>
                </span>
              </label>
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
                <p className="text-[11px] text-slate-400 mt-1">
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
