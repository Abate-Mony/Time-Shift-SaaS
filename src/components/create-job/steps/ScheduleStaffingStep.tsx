import { Check, ChevronDown, Users, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Avatar, Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { RecurringJobSection } from "@/components/RecurringJobSection"
import { PlanLockBadge } from "@/components/billing/PlanLockBadge"
import { useCompanyPlan } from "@/hooks/useCompanyPlan"
import { useCreateJob } from "../CreateJobContext"
import { FieldError } from "../FieldError"
import SearchComponent from "@/components/Search"

export function ScheduleStaffingStep() {
  const {
    form,
    users,
    selectedWorkers,
    toggleWorker,
    workerOpen,
    setWorkerOpen,
    recurring,
    setRecurring,
  } = useCreateJob()

  const { hasFeature } = useCompanyPlan()
  const canRecurring = hasFeature("recurringJobs")
  const canOpenShifts = hasFeature("openShifts")

  const { register, setValue, watch, formState: { errors } } = form

  const date = watch("date")
  const requiredWorkers = watch("requiredWorkers") ?? 1
  const supervisor = watch("supervisor")
  const openToClaims = watch("openToClaims") ?? false
  const requiresApproval = watch("requiresApproval") ?? true

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Recurrence */}
      <RecurringJobSection value={recurring} onChange={setRecurring} startDate={date} sectionIndex={1} disabled={!canRecurring} />

      {/* Staffing */}
      <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
        <h2 className="text-sm font-semibold text-foreground mb-4">Staffing</h2>

        <div className="max-w-xs min-w-0 mb-5">
          <Input
            label="Workers needed"
            type="number"
            min="1"
            {...register("requiredWorkers", { valueAsNumber: true })}
            className={cn(errors.requiredWorkers && "border-red-500!")}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {selectedWorkers.length} of {requiredWorkers || 1} assigned
            {selectedWorkers.length < (requiredWorkers || 1) && " — the rest stay open"}
          </p>
          <FieldError message={errors.requiredWorkers?.message as string} />
        </div>

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Assign workers
        </p>
  
        <button
          type="button"
          onClick={() => setWorkerOpen(!workerOpen)}
          className="w-full flex items-center justify-between h-9 px-3 border border-[var(--border)] rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors min-w-0"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Users size={14} className="text-muted-foreground shrink-0" />
            <span className="truncate">
              {selectedWorkers.length > 0
                ? `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? "s" : ""} selected`
                : "Select workers..."}
            </span>
          </span>
          <ChevronDown
            size={14}
            className={cn("text-muted-foreground transition-transform shrink-0", workerOpen && "rotate-180")}
          />
        </button>

        <FieldError message={errors.workers?.message as string} />
      {
          workerOpen && <div className='mr-auto  my-2'>
            <SearchComponent
              placeholder='search workers'
            />
          </div>
        }
        {workerOpen && (
          <div className="mt-2 border border-[var(--border)] rounded-xl overflow-hidden min-w-0">
            {users.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No workers yet</p>
            )}
            {users.map((w, i) => {
              const selected = selectedWorkers.some(sw => sw.email === w.email)
              return (
                <button
                  type="button"
                  key={w._id}
                  onClick={() => toggleWorker(w.email)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors border-b border-[var(--border)] last:border-0 min-w-0",
                    selected && "bg-blue-50/40"
                  )}
                >
                  <Avatar initials={w.fullname.slice(0, 2)} size="sm" index={i} src={w.profilePhoto?.url} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{w.fullname}</p>
                    <p className="text-xs text-muted-foreground">{w.role}</p>
                  </div>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      selected ? "bg-[var(--primary)] border-[var(--primary)]" : "border-slate-300"
                    )}
                  >
                    {selected && <Check size={11} className="text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedWorkers.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 min-w-0">
            {selectedWorkers.map(sw => (
              <div
                key={sw.email}
                className="shrink-0 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full pl-2.5 pr-2 py-0.5"
              >
                <span className="text-xs font-medium text-blue-700">
                  {sw.fullname.split(" ")[0]}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWorker(sw.email)}
                  className="text-blue-400 hover:text-blue-600"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Supervisor */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Supervisor
          </p>
          <p className="text-[11px] text-muted-foreground mb-2">
            The person workers should contact on site. Optional.
          </p>
          <div className="relative max-w-xs min-w-0">
            <select
              value={supervisor ?? ""}
              onChange={e => setValue("supervisor", e.target.value || undefined, { shouldValidate: true })}
              className="w-full h-10 pl-3 pr-8 border border-[var(--border)] rounded-lg text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] appearance-none cursor-pointer transition-all"
            >
              <option value="">No supervisor assigned</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>
                  {u.fullname}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Open shifts */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] min-w-0">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Open to claims</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Lets any worker claim an unfilled slot on this shift.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {!canOpenShifts && !openToClaims && <PlanLockBadge label="Upgrade for open shifts" />}
              <Switch
                on={openToClaims}
                disabled={!canOpenShifts}
                onToggle={() => setValue("openToClaims", !openToClaims, { shouldValidate: true })}
              />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {openToClaims && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: "hidden" }}
                className="min-w-0"
              >
                <div className="flex items-center justify-between gap-3 min-w-0 mt-4 pl-4 border-l-2 border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Require approval</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      You approve each claim before the shift is theirs.
                    </p>
                  </div>
                  <Switch
                    on={requiresApproval}
                    onToggle={() =>
                      setValue("requiresApproval", !requiresApproval, { shouldValidate: true })
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Switch({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      title={disabled ? "Upgrade your plan to use this" : undefined}
      onClick={onToggle}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-1",
        disabled && "opacity-40 cursor-not-allowed",
        on ? "bg-[var(--primary)]" : "bg-muted"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm", on ? "left-6" : "left-1")}
      />
    </button>
  )
}
