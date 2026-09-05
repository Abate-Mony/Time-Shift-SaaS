import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Pencil,
  PoundSterling,
  Repeat2,
  ShieldCheck,
  UserRound,
  Users,
  Building2,
  BriefcaseBusiness,
} from "lucide-react"
import dayjs from "dayjs"

import { cn } from "@/lib/utils"
import { formatCurrency } from "@/utils/format"

import { useCreateJob } from "../CreateJobContext"
import { formatHours } from "../wizardConfig"
import { describeRecurring } from "../describeRecurring"

type SectionProps = {
  title: string
  description?: string
  step: number
  icon: React.ReactNode
  onEdit: (step: number) => void
  children: React.ReactNode
}

function Section({
  title,
  description,
  step,
  icon,
  onEdit,
  children,
}: SectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden min-w-0">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#F1F5F9] bg-slate-50/50 min-w-0">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/[0.07] flex items-center justify-center text-[#1E3A5F] shrink-0">
            {icon}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">
              {title}
            </h3>

            {description && (
              <p className="text-xs text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onEdit(step)}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#1E3A5F] hover:bg-[#1E3A5F]/[0.06] transition-colors"
        >
          <Pencil size={11} />
          Edit
        </button>
      </div>

      <div className="p-5 min-w-0">
        {children}
      </div>
    </section>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 min-w-0">
      {icon && (
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">
          {label}
        </p>

        <div className="text-sm font-medium text-slate-800 min-w-0 break-words">
          {value}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "positive" | "negative"
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 min-w-0">
      <p
        className={cn(
          "text-base font-bold truncate",
          tone === "positive" && "text-emerald-600",
          tone === "negative" && "text-red-600",
          tone === "default" && "text-slate-900"
        )}
      >
        {value}
      </p>

      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
        {label}
      </p>
    </div>
  )
}

export function ReviewStep() {
  const {
    form,
    selectedClient,
    selectedWorkers,
    recurring,
    users,
    shiftHours,
    totalCost,
    totalCharge,
    margin,
    goToStep,
  } = useCreateJob()

  const v = form.getValues()

  const isOvernight =
    Boolean(v.startTime && v.endTime) &&
    v.endTime < v.startTime

  const supervisorUser =
    users.find((u) => u._id === v.supervisor)

  const hasLocation =
    Boolean(v.location || v.address)

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#DCE5EF] bg-gradient-to-br from-[#1E3A5F] to-[#284D78] px-6 py-6 text-white shadow-sm">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/[0.04]" />
        <div className="absolute right-10 bottom-0 w-20 h-20 rounded-full bg-white/[0.03]" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-blue-100">
              Final review
            </p>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {v.title || "Review your job"}
          </h2>

          <p className="text-sm text-blue-100/80 mt-1 max-w-xl">
            Check everything before publishing. Workers will be notified once the job goes live.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {selectedClient && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Building2 size={12} />
                {selectedClient.name}
              </span>
            )}

            {recurring.enabled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Repeat2 size={12} />
                Recurring
              </span>
            )}

            {v.priority && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
                  v.priority === "urgent" &&
                    "bg-red-400/20 text-red-100",
                  v.priority === "high" &&
                    "bg-orange-300/20 text-orange-100",
                  v.priority === "medium" &&
                    "bg-amber-300/20 text-amber-100",
                  v.priority === "low" &&
                    "bg-white/10 text-blue-100"
                )}
              >
                {v.priority} priority
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <Section
        title="Job details"
        description="Client, job type and priority"
        step={1}
        onEdit={goToStep}
        icon={<BriefcaseBusiness size={16} />}
      >
        {v.description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            {v.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <DetailRow
            icon={<Building2 size={13} />}
            label="Client"
            value={
              selectedClient?.name ?? (
                <span className="text-slate-400">
                  No client
                </span>
              )
            }
          />

          <DetailRow
            label="Priority"
            value={
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                  v.priority === "urgent" &&
                    "bg-red-50 text-red-700",
                  v.priority === "high" &&
                    "bg-orange-50 text-orange-700",
                  v.priority === "medium" &&
                    "bg-amber-50 text-amber-700",
                  v.priority === "low" &&
                    "bg-slate-100 text-slate-600"
                )}
              >
                {v.priority}
              </span>
            }
          />
        </div>
      </Section>

      {/* When & Where */}
      <Section
        title="When & where"
        description="Shift date, time and work location"
        step={1}
        onEdit={goToStep}
        icon={<CalendarDays size={16} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <DetailRow
            icon={<CalendarDays size={13} />}
            label="Date"
            value={
              v.date ? (
                dayjs(v.date).format(
                  "dddd D MMMM YYYY"
                )
              ) : (
                <span className="text-slate-400">
                  Not set
                </span>
              )
            }
          />

          <DetailRow
            icon={<Clock3 size={13} />}
            label="Time"
            value={
              v.startTime && v.endTime ? (
                <span>
                  {v.startTime}–{v.endTime}
                  <span className="text-slate-400 font-normal">
                    {" "}
                    · {formatHours(shiftHours)}
                  </span>

                  {isOvernight && (
                    <span className="ml-1 text-blue-600 text-xs font-semibold">
                      Overnight
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400">
                  Not set
                </span>
              )
            }
          />
        </div>

        {hasLocation && (
          <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                <MapPin
                  size={14}
                  className="text-[#1E3A5F]"
                />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {v.location ||
                    "Selected location"}
                </p>

                {v.address && (
                  <p className="text-xs text-slate-500 mt-0.5 break-words">
                    {v.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Recurring */}
      {recurring.enabled && (
        <Section
          title="Recurring schedule"
          description="How often this shift repeats"
          step={2}
          onEdit={goToStep}
          icon={<Repeat2 size={16} />}
        >
          <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-4 py-3 flex items-start gap-3">
            <Repeat2
              size={15}
              className="text-blue-600 mt-0.5 shrink-0"
            />

            <p className="text-sm font-medium text-blue-900">
              {describeRecurring(recurring)}
            </p>
          </div>
        </Section>
      )}

      {/* Staffing */}
      <Section
        title="Staffing"
        description="Workers and shift coverage"
        step={2}
        onEdit={goToStep}
        icon={<Users size={16} />}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard
            label="Workers needed"
            value={String(v.requiredWorkers ?? 1)}
          />

          <StatCard
            label="Assigned"
            value={String(selectedWorkers.length)}
          />
        </div>

        {selectedWorkers.length > 0 ? (
          <div className="flex flex-col gap-2">
            {selectedWorkers.map((worker) => (
              <div
                key={worker.email}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 min-w-0"
              >
                <div className="w-8 h-8 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center text-xs font-bold shrink-0">
                  {worker.fullname
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {worker.fullname}
                  </p>

                  <p className="text-xs text-slate-400 truncate">
                    {worker.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2.5">
            <Users
              size={15}
              className="text-amber-600 mt-0.5 shrink-0"
            />

            <p className="text-sm text-amber-700">
              Nobody is assigned yet. This shift will be unstaffed when published.
            </p>
          </div>
        )}

        {(supervisorUser || v.openToClaims) && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {supervisorUser && (
              <DetailRow
                icon={<UserRound size={13} />}
                label="Supervisor"
                value={supervisorUser.fullname}
              />
            )}

            {v.openToClaims && (
              <DetailRow
                label="Open shifts"
                value={
                  v.requiresApproval
                    ? "Workers can claim with manager approval"
                    : "Workers can claim automatically"
                }
              />
            )}
          </div>
        )}
      </Section>

      {/* Billing */}
      <Section
        title="Pay & billing"
        description="Worker cost and client charge"
        step={3}
        onEdit={goToStep}
        icon={<PoundSterling size={16} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/60">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
              Worker rate
            </p>

            <p className="text-lg font-bold text-slate-900 mt-1">
              {formatCurrency(v.payRate ?? 0)}
              <span className="text-xs font-medium text-slate-400">
                /hour
              </span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/60">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-400">
              Client charge
            </p>

            <p className="text-lg font-bold text-slate-900 mt-1">
              {v.chargeType === "fixed"
                ? formatCurrency(
                    v.chargeAmount ?? 0
                  )
                : formatCurrency(
                    v.chargeRate ?? 0
                  )}

              <span className="text-xs font-medium text-slate-400">
                {v.chargeType === "fixed"
                  ? " fixed"
                  : "/hour"}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Est. cost"
            value={formatCurrency(totalCost)}
          />

          <StatCard
            label="Est. charge"
            value={formatCurrency(totalCharge)}
          />

          <StatCard
            label="Est. margin"
            value={formatCurrency(margin)}
            tone={
              margin >= 0
                ? "positive"
                : "negative"
            }
          />
        </div>
      </Section>

      {/* Policies */}
      <Section
        title="Instructions & policies"
        description="Clock-in rules and worker guidance"
        step={4}
        onEdit={goToStep}
        icon={<ShieldCheck size={16} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <DetailRow
            icon={<Clock3 size={13} />}
            label="Clock-in window"
            value={
              v.clockInGraceMinutes ? (
                `${v.clockInGraceMinutes} minutes early`
              ) : (
                <span className="text-slate-400">
                  Company default
                </span>
              )
            }
          />

          <DetailRow
            icon={<MapPin size={13} />}
            label="Location check"
            value={
              v.geofenceMode ? (
                v.geofenceMode === "off" ? (
                  "No location check"
                ) : (
                  <>
                    {v.geofenceMode ===
                    "enforce"
                      ? "Require on site"
                      : "Record and flag"}
                    {" · "}
                    {v.geofenceRadiusMeters ??
                      150}
                    m
                  </>
                )
              ) : (
                <span className="text-slate-400">
                  Company default
                </span>
              )
            }
          />
        </div>

        {v.instructions && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-blue-500 mb-1">
              Worker instructions
            </p>

            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
              {v.instructions}
            </p>
          </div>
        )}

        {v.notes && (
          <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-amber-600 mb-1">
              Internal notes
            </p>

            <p className="text-sm text-slate-600 italic whitespace-pre-wrap break-words">
              {v.notes}
            </p>
          </div>
        )}
      </Section>
    </div>
  )
}