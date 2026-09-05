import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { STEPS, TOTAL_STEPS } from "./wizardConfig"

interface Props {
  currentStep: number
  /** Highest step reached — earlier steps are clickable, later ones aren't */
  furthestStep: number
  onStepClick: (step: number) => void
}

export function CreateJobStepper({ currentStep, furthestStep, onStepClick }: Props) {
  const active = STEPS.find(s => s.id === currentStep)

  return (
    <div className="mb-6 min-w-0">
      {/* Desktop — labelled steps with connecting lines */}
      <div className="hidden sm:flex items-center min-w-0">
        {STEPS.map((step, i) => {
          const isComplete = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isReachable = step.id <= furthestStep

          return (
            <div key={step.id} className="flex items-center flex-1 min-w-0 last:flex-none">
              <button
                type="button"
                onClick={() => isReachable && onStepClick(step.id)}
                disabled={!isReachable}
                className={cn(
                  "flex items-center gap-2 min-w-0 shrink-0 rounded-lg px-1 py-1 transition-opacity",
                  isReachable ? "cursor-pointer hover:opacity-80" : "cursor-default"
                )}
              >
                <motion.span
                  animate={{
                    backgroundColor: isComplete ? "#10B981" : isCurrent ? "#1E3A5F" : "#E2E8F0",
                    scale: isCurrent ? 1.08 : 1,
                  }}
                  transition={{ duration: 0.25 }}
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                >
                  {isComplete ? (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  ) : (
                    <span className="text-[10px] font-bold text-white">{step.id}</span>
                  )}
                </motion.span>

                <span
                  className={cn(
                    "text-xs font-semibold truncate",
                    isCurrent ? "text-slate-800" : isComplete ? "text-emerald-600" : "text-slate-400"
                  )}
                >
                  {step.shortTitle}
                </span>
              </button>

              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-3 bg-slate-200 min-w-0 overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    initial={false}
                    animate={{ width: step.id < currentStep ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile — count, title, progress bar */}
      <div className="sm:hidden min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-1.5 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{active?.title}</p>
          <p className="text-xs text-slate-400 shrink-0">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#1E3A5F] rounded-full"
            initial={false}
            animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  )
}
