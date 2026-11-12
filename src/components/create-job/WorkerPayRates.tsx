import { Pencil, Plus, RotateCcw } from "lucide-react"
import { Avatar } from "@/components/ui"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"
import { parseRateInput } from "@/utils/workerPay"
import { useCreateJob } from "./CreateJobContext"

/**
 * "Rate per worker" list under the default pay rate in the Pay & billing
 * step. Every assigned worker is on the job's default rate unless the
 * manager gives them their own; open (unclaimed) slots always pay the
 * default. Only rendered once at least one worker has been picked.
 */
export function WorkerPayRates() {
  const { form, selectedWorkers, workerPayRates, setWorkerPayRate } = useCreateJob()

  const payRate = Number(form.watch("payRate")) || 0
  const chargeType = form.watch("chargeType") ?? "hourly"
  const chargeRate = Number(form.watch("chargeRate")) || 0
  const requiredRaw = form.watch("requiredWorkers")
  const required = typeof requiredRaw === "number" && Number.isFinite(requiredRaw) ? Math.max(requiredRaw, 1) : 1
  const openSlots = Math.max(required - selectedWorkers.length, 0)

  if (selectedWorkers.length === 0) return null

  const customCount = selectedWorkers.filter(w => workerPayRates[w.email] !== undefined).length

  return (
    <div className="mt-5 border border-[var(--border)] rounded-xl overflow-hidden min-w-0">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/50 border-b border-[var(--border)]">
        <p className="text-sm font-semibold text-foreground">Rate per worker</p>
        <span
          className={cn(
            "text-[11px] font-semibold rounded-full px-2.5 py-0.5",
            customCount
              ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
              : "bg-muted text-muted-foreground"
          )}
        >
          {customCount ? `${customCount} custom rate${customCount === 1 ? "" : "s"}` : "All on default"}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {selectedWorkers.map((w, i) => {
          const raw = workerPayRates[w.email]
          const isCustom = raw !== undefined
          const custom = parseRateInput(raw)
          const rate = custom ?? payRate
          const diff = rate - payRate
          const missing = isCustom && custom === undefined
          const losesMoney = isCustom && custom !== undefined && chargeType === "hourly" && chargeRate > 0 && custom > chargeRate

          return (
            <li key={w.email} className={cn("px-4 py-3 min-w-0", isCustom && "bg-blue-50/40 dark:bg-blue-500/5")}>
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <Avatar initials={w.fullname?.slice(0, 2)} size="sm" index={i} />
                <div className="flex-1 min-w-32">
                  <p className="text-sm font-semibold text-foreground truncate">{w.fullname}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{w.email}</p>
                </div>

                {isCustom ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center h-10 w-36 px-2.5 gap-1 rounded-lg border-2 border-[var(--primary)] bg-card focus-within:ring-2 focus-within:ring-blue-500/40">
                      <span className="text-sm font-semibold text-muted-foreground">£</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        autoFocus={raw === String(payRate)}
                        aria-label={`Pay rate for ${w.fullname}`}
                        value={raw}
                        onChange={e => setWorkerPayRate(w.email, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent outline-none text-sm font-bold text-foreground tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </label>
                    {!missing && (
                      <span
                        className={cn(
                          "text-[11px] font-bold rounded-md px-2 py-1 tabular-nums",
                          diff > 0
                            ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
                            : diff < 0
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {diff === 0 ? "Same as default" : `${diff > 0 ? "+" : "−"}${formatCurrency(Math.abs(diff))} vs default`}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setWorkerPayRate(w.email, undefined)}
                      className="h-10 px-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      <RotateCcw size={13} /> Use default
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(payRate)}/hr</span>
                    <span className="text-[10px] font-semibold rounded-md px-1.5 py-0.5 bg-muted text-muted-foreground">Default</span>
                    <button
                      type="button"
                      onClick={() => setWorkerPayRate(w.email, String(payRate))}
                      className="h-10 px-3 flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Pencil size={12} /> Set own rate
                    </button>
                  </div>
                )}
              </div>

              {missing && (
                <p className="mt-2 text-[11px] text-red-600">Enter a rate, or use the default — until then {formatCurrency(payRate)}/hr is used.</p>
              )}
              {losesMoney && (
                <p className="mt-2 text-[11px] text-amber-900 dark:text-amber-200 bg-[var(--warning-bg)] border border-amber-300/70 rounded-lg px-2.5 py-1.5">
                  Paid {formatCurrency(custom!)}/hr but the client is charged {formatCurrency(chargeRate)}/hr — you lose money on this worker.
                </p>
              )}
            </li>
          )
        })}

        {openSlots > 0 && (
          <li className="flex items-center gap-3 px-4 py-3">
            <span className="size-8 rounded-full border-[1.5px] border-dashed border-muted-foreground/60 flex items-center justify-center text-muted-foreground shrink-0">
              <Plus size={14} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {openSlots} open slot{openSlots === 1 ? "" : "s"}
              </p>
              <p className="text-[11px] text-muted-foreground">Whoever claims {openSlots === 1 ? "it" : "them"} gets the default rate</p>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(payRate)}/hr</span>
          </li>
        )}
      </ul>
    </div>
  )
}
