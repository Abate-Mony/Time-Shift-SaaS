import { Calendar, Clock, MapPin } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"
import SearchLocation from "@/components/locationSearchComponent"
import { ApplyRatePrompt, ClientCombobox } from "@/components/client/ClientCombobox"
import { useCreateJob } from "../CreateJobContext"
import { formatHours } from "../wizardConfig"
import { FieldError } from "../FieldError"

const PRIORITIES = [
  { value: "low", label: "Low", className: "text-slate-700" },
  { value: "medium", label: "Medium", className: "text-amber-600" },
  { value: "high", label: "High", className: "text-orange-600" },
  { value: "urgent", label: "Urgent", className: "text-red-600" },
] as const

export function JobDetailsStep() {
  const {
    form,
    selectedClient,
    handleClientSelect,
    showApplyRate,
    previousChargeRate,
    applyClientRate,
    keepCurrentRate,
    shiftHours,
  } = useCreateJob()

  const { register, setValue, watch, formState: { errors } } = form

  const priority = watch("priority")
  const address = watch("address")
  const startTime = watch("startTime")
  const endTime = watch("endTime")

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Job details */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Job details</h2>

        <div className="flex flex-col gap-4 min-w-0">
          <div className="min-w-0">
            <Input
              label="Job name"
              placeholder="e.g. Canary Wharf Security — Night Shift"
              {...register("title")}
              className={cn(errors.title && "border-red-500!")}
            />
            <FieldError message={errors.title?.message as string} />
          </div>

          <div className="min-w-0">
            <Textarea
              {...register("description")}
              placeholder="Brief description of the work required..."
              className={cn(errors.description && "border-red-500!")}
            />
            <FieldError message={errors.description?.message as string} />
          </div>

          <div className="min-w-0">
            <ClientCombobox value={selectedClient} onChange={handleClientSelect} />
            <FieldError message={errors.client?.message as string} />

            {showApplyRate && selectedClient && previousChargeRate !== null && (
              <div className="mt-2 min-w-0">
                <ApplyRatePrompt
                  client={selectedClient}
                  currentRate={previousChargeRate}
                  onKeep={keepCurrentRate}
                  onApply={applyClientRate}
                />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Priority
            </p>
            <div className="flex flex-wrap gap-2 min-w-0">
              {PRIORITIES.map(item => (
                <label
                  key={item.value}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-all",
                    priority === item.value
                      ? "border-[#1E3A5F] bg-[#1E3A5F]/[0.03]"
                      : "border-[#E2E8F0] hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="priority"
                    className="sr-only"
                    value={item.value}
                    checked={priority === item.value}
                    onChange={() => setValue("priority", item.value, { shouldValidate: true })}
                  />
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                      priority === item.value ? "border-[#1E3A5F] bg-[#1E3A5F]" : "border-slate-300"
                    )}
                  >
                    {priority === item.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className={cn("text-sm font-medium", item.className)}>{item.label}</span>
                </label>
              ))}
            </div>
            <FieldError message={errors.priority?.message as string} />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Location</h2>

        <SearchLocation
          onSelect={location => {
            setValue("location", location.siteName, { shouldValidate: true })
            setValue(
              "address",
              [location.address, location.city, location.postcode].filter(Boolean).join(", "),
              { shouldValidate: true }
            )
            setValue("coordinates", { lat: location.lat, lng: location.lng }, { shouldValidate: true })
          }}
        />
        <FieldError message={errors.location?.message as string} />

        {address && (
          <>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{address}</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Only the general area is shown to workers before they're assigned — the exact
              address is used for directions once someone is.
            </p>
          </>
        )}

        {/* <div className="mt-3 h-36 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <MapPin size={20} className="text-slate-400 mx-auto mb-1" />
            <p className="text-xs text-slate-400">Map preview will appear here</p>
          </div>
        </div> */}
      </div>

      {/* Date & time */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">Date & time</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
          <div className="min-w-0">
            <Input
              label="Date"
              type="date"
              min={dayjs().format("YYYY-MM-DD")}
              icon={<Calendar size={14} />}
              {...register("date")}
              className={cn(errors.date && "border-red-500!")}
            />
            <FieldError message={errors.date?.message as string} />
          </div>

          <div className="min-w-0">
            <Input
              label="Start time"
              type="time"
              icon={<Clock size={14} />}
              {...register("startTime")}
              className={cn(errors.startTime && "border-red-500!")}
            />
            <FieldError message={errors.startTime?.message as string} />
          </div>

          <div className="min-w-0">
            <Input
              label="End time"
              type="time"
              icon={<Clock size={14} />}
              {...register("endTime")}
              className={cn(errors.endTime && "border-red-500!")}
            />
            <FieldError message={errors.endTime?.message as string} />
          </div>
        </div>

        {shiftHours > 0 && (
          <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2 min-w-0">
            <Clock size={14} className="text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700 min-w-0">
              <span className="font-semibold">{formatHours(shiftHours)}</span> shift duration
              {endTime < startTime && <span className="text-blue-500"> · overnight</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
