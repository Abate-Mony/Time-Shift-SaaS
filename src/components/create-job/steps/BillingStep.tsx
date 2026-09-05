import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Pencil } from "lucide-react"
import { Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"
import { useCreateJob } from "../CreateJobContext"
import { FieldError } from "../FieldError"

const CHARGE_TYPES = [
  { value: "hourly", label: "Hourly rate", sub: "Bills by hours worked" },
  { value: "fixed", label: "Fixed price", sub: "One agreed total, whatever the hours" },
] as const

export function BillingStep() {
  const { form, selectedClient, selectedWorkers, shiftHours, totalCost, totalCharge, margin } =
    useCreateJob()

  const { register, setValue, watch, formState: { errors } } = form

  const payRate = watch("payRate") ?? 0
  const chargeType = watch("chargeType") ?? "hourly"
  const chargeRate = watch("chargeRate") ?? 0
  const chargeAmount = watch("chargeAmount") ?? 0

  // Whether the job is currently sitting on the client's default, or has been
  // overridden. Tracked explicitly rather than inferred purely from value
  // equality — a client whose default rate is £0.00 would otherwise make
  // Override a no-op (it resets the field to 0, which it already was).
  const [rateOverridden, setRateOverridden] = useState(false)
  useEffect(() => {
    setRateOverridden(false)
  }, [selectedClient?._id])

  const clientDefaultRate = selectedClient?.defaultChargeRate ?? null
  const clientDefaultType = selectedClient?.defaultChargeType ?? "hourly"
  const onClientDefault =
    !rateOverridden &&
    clientDefaultRate !== null &&
    chargeType === clientDefaultType &&
    (chargeType === "hourly" ? chargeRate === clientDefaultRate : chargeAmount === clientDefaultRate)

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* What you pay */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">What you pay workers</h2>

        <div className="max-w-xs min-w-0">
          <Input
            label="Worker pay rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon={<span className="text-slate-400 text-xs font-semibold">£</span>}
            {...register("payRate", { valueAsNumber: true })}
            className={cn(errors.payRate && "border-red-500!")}
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Per hour, paid to each assigned worker
          </p>
          <FieldError message={errors.payRate?.message as string} />
        </div>
      </div>

      {/* What you charge */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">What you charge the client</h2>

        {selectedClient && clientDefaultRate !== null && onClientDefault ? (
          <div className="mt-3 flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{selectedClient.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {clientDefaultType === "fixed"
                  ? `${formatCurrency(clientDefaultRate)} fixed per job`
                  : `${formatCurrency(clientDefaultRate)}/hour`}{" "}
                · Client default
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRateOverridden(true)
                // Reset whichever field is actually in play for the current
                // charge type — resetting chargeRate while on "fixed" (or
                // vice versa) wouldn't clear onClientDefault above, leaving
                // the "default" banner stuck showing with no way out.
                setValue(chargeType === "fixed" ? "chargeAmount" : "chargeRate", 0, { shouldValidate: false })
              }}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Pencil size={12} /> Override
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 mb-4">
            {selectedClient
              ? `Overriding ${selectedClient.name}'s default for this job only.`
              : "Pick a client on step 1 to use their default rate."}
          </p>
        )}

        <div className="mt-4 min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 mb-4 min-w-0">
            {CHARGE_TYPES.map(opt => (
              <label
                key={opt.value}
                className={cn(
                  "flex-1 min-w-0 flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                  chargeType === opt.value
                    ? "border-[#1E3A5F] bg-[#1E3A5F]/[0.03]"
                    : "border-[#E2E8F0] hover:border-slate-300"
                )}
              >
                <input
                  type="radio"
                  name="chargeType"
                  className="sr-only"
                  value={opt.value}
                  checked={chargeType === opt.value}
                  onChange={() => setValue("chargeType", opt.value, { shouldValidate: true })}
                />
                <span
                  className={cn(
                    "mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    chargeType === opt.value ? "border-[#1E3A5F] bg-[#1E3A5F]" : "border-slate-300"
                  )}
                >
                  {chargeType === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                  <span className="block text-[11px] text-slate-400 mt-0.5">{opt.sub}</span>
                </span>
              </label>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {chargeType === "fixed" ? (
              <motion.div
                key="fixed"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="max-w-xs min-w-0"
              >
                <Input
                  label="Fixed price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  icon={<span className="text-slate-400 text-xs font-semibold">£</span>}
                  {...register("chargeAmount", { valueAsNumber: true })}
                  className={cn(errors.chargeAmount && "border-red-500!")}
                />
                <FieldError message={errors.chargeAmount?.message as string} />
              </motion.div>
            ) : (
              <motion.div
                key="hourly"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="max-w-xs min-w-0"
              >
                <Input
                  label="Charge rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  icon={<span className="text-slate-400 text-xs font-semibold">£</span>}
                  {...register("chargeRate", { valueAsNumber: true })}
                  className={cn(errors.chargeRate && "border-red-500!")}
                />
                <FieldError message={errors.chargeRate?.message as string} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {shiftHours > 0 && (payRate > 0 || totalCharge > 0) && (
          <div className="mt-5 pt-5 border-t border-[#F1F5F9] min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Estimated for this shift
              {selectedWorkers.length > 1 && ` · ${selectedWorkers.length} workers`}
            </p>
            <div className="grid grid-cols-3 gap-3 min-w-0">
              {[
                { label: "Cost", value: totalCost },
                { label: "Charge", value: totalCharge },
                { label: "Margin", value: margin, highlight: true },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 min-w-0"
                >
                  <p
                    className={cn(
                      "text-sm font-bold truncate",
                      s.highlight
                        ? s.value >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                        : "text-slate-900"
                    )}
                  >
                    {formatCurrency(s.value)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
