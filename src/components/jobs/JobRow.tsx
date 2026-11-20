import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { useMutation } from "@tanstack/react-query"
import toast from "react-hot-toast"
import dayjs from "dayjs"
import { AlertTriangle, CalendarRange, Copy, CopyPlus, MapPin, MoreHorizontal, Pencil, Repeat, Trash2, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AssignWorkersModal from "@/components/AssignWorkersModal"
import { cn } from "@/lib/utils"
import { queryClient } from "@/lib/queryClient"
import customFetch from "@/utils/customFetch"
import { deleteJob } from "@/utils/api-request-functions"
import { backLinkState } from "@/hooks/useBackLink"
import { isJobLocked } from "@/utils/jobLock"
import { isAllDay, liveWorkers, siteName, splitMatches, type JobListItem } from "@/utils/jobsList"

const AVATAR_COLOURS = ["#0EA5E9", "#8B5CF6", "#F43F5E", "#10B981", "#F59E0B", "#6366F1", "#14B8A6", "#EC4899"]
const colourFor = (key: string) => AVATAR_COLOURS[[...key].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_COLOURS.length]
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("") || "?"

const hoursLabel = (minutes?: number) => {
  const m = Number(minutes) || 0
  const h = Math.floor(m / 60)
  const r = m % 60
  return r ? `${h}h ${r}m` : `${h}h`
}

export function Highlight({ text, term }: { text: string; term?: string | null }) {
  return (
    <>
      {splitMatches(text, term).map((p, i) =>
        p.match ? <mark key={i} className="bg-yellow-200/80 text-inherit rounded-[3px] px-px">{p.text}</mark> : <span key={i}>{p.text}</span>
      )}
    </>
  )
}

function StatusPill({ job, isPast }: { job: JobListItem; isPast: boolean }) {
  const clockedIn = liveWorkers(job.workers).filter(w => w.status === "in-progress").length
  let tone = "bg-blue-50 text-blue-700"
  let label = "Published"
  if (job.status === "cancelled") { tone = "bg-muted text-muted-foreground"; label = "Cancelled" }
  else if (job.status === "completed") { tone = "bg-muted text-muted-foreground"; label = "Completed" }
  else if (job.status === "draft") { tone = "bg-slate-100 text-slate-600"; label = "Draft — not sent" }
  else if (clockedIn > 0) { tone = "bg-emerald-50 text-emerald-700"; label = `In progress · ${clockedIn} clocked in` }
  else if (!isPast && job.staffing?.open > 0) { tone = "bg-red-50 text-red-700"; label = "Needs workers" }
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", tone)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

function Staffing({ job }: { job: JobListItem }) {
  const s = job.staffing ?? { required: 1, filled: 0, pending: 0, open: 1 }
  const people = liveWorkers(job.workers)
  const shown = people.slice(0, 3)
  const slots = Math.min(s.open, Math.max(0, 4 - shown.length))
  const tone = s.open === 0 ? "text-emerald-700" : s.filled + s.pending === 0 ? "text-red-700" : "text-amber-700"
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex shrink-0">
        {shown.map((w, i) => (
          <span
            key={w._id ?? w.worker ?? i}
            title={`${w.fullname}${w.status === "pending" ? " — invited, not answered yet" : ""}`}
            className={cn(
              "w-7 h-7 rounded-full border-2 border-card text-white text-[10px] font-bold flex items-center justify-center",
              i > 0 && "-ml-1.5",
              w.status === "pending" && "opacity-55"
            )}
            style={{ background: colourFor(w.worker ?? w.email ?? String(i)) }}
          >
            {initials(w.fullname)}
          </span>
        ))}
        {people.length > shown.length && (
          <span className="-ml-1.5 w-7 h-7 rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground flex items-center justify-center">
            +{people.length - shown.length}
          </span>
        )}
        {Array.from({ length: slots }).map((_, i) => (
          <span
            key={`slot-${i}`}
            title="Open place"
            className={cn(
              "w-7 h-7 rounded-full border-[1.5px] border-dashed border-amber-400 bg-amber-50 text-amber-700 text-xs font-bold flex items-center justify-center",
              (shown.length > 0 || i > 0) && "-ml-1.5"
            )}
          >
            +
          </span>
        ))}
      </div>
      <span className={cn("text-xs font-semibold whitespace-nowrap", tone)}>
        {s.filled} / {s.required} filled
        {s.pending > 0 && <span className="font-normal text-muted-foreground"> · {s.pending} invited</span>}
      </span>
    </div>
  )
}

export function JobRow({
  job, selected, onSelect, search, today,
}: {
  job: JobListItem
  selected: boolean
  onSelect: (checked: boolean) => void
  search?: string | null
  today: string
}) {
  const navigate = useNavigate()
  const [assignOpen, setAssignOpen] = useState(false)
  const isPast = dayjs(job.date).format("YYYY-MM-DD") < today
  const upcoming = !isPast && (job.status === "draft" || job.status === "published")
  const brokenTime = job.attention?.includes("time")
  const allDay = isAllDay(job)
  const site = siteName(job)
  const locked = isJobLocked(job)

  const publish = useMutation({
    mutationFn: () => customFetch.patch(`/jobs/${job._id}`, { status: "published" }),
    onSuccess: () => { toast.success("Job published"); queryClient.invalidateQueries({ queryKey: ["jobs"] }) },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Couldn't publish the job."),
  })
  const duplicate = useMutation({
    mutationFn: (shiftDays: number) => customFetch.post(`/jobs/duplicate-job/${job._id}`, shiftDays ? { shiftDays } : {}),
    onSuccess: (_d, shiftDays) => {
      toast.success(shiftDays ? "Copied to next week as a draft" : "Job duplicated as a draft")
      queryClient.invalidateQueries({ queryKey: ["jobs"] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.msg ?? "Couldn't copy the job."),
  })

  const open = () => navigate(`/jobs/${job._id}`, { state: backLinkState("Jobs") })

  const action = brokenTime && upcoming ? (
    <Link
      to={`/jobs/${job._id}/edit`}
      onClick={e => e.stopPropagation()}
      className="h-8 px-3 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold inline-flex items-center whitespace-nowrap"
    >
      Fix time
    </Link>
  ) : upcoming && job.status === "draft" ? (
    <button
      type="button"
      disabled={publish.isPending}
      onClick={e => { e.stopPropagation(); publish.mutate() }}
      className="h-8 px-3 rounded-lg border border-[var(--border)] bg-card text-xs font-semibold hover:bg-muted disabled:opacity-50 whitespace-nowrap"
    >
      {publish.isPending ? "Publishing…" : "Publish"}
    </button>
  ) : upcoming && job.staffing?.open > 0 ? (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); setAssignOpen(true) }}
      className={cn(
        "h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap",
        job.staffing.filled + job.staffing.pending === 0
          ? "bg-[var(--primary)] text-white"
          : "border border-[var(--border)] bg-card hover:bg-muted"
      )}
    >
      Assign
    </button>
  ) : null

  const badges = (
    <>
      {(job.priority === "high" || job.priority === "urgent") && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-red-700 bg-red-50 rounded px-1.5 py-0.5">{job.priority}</span>
      )}
      {job.bookingPosition && job.bookingPosition.of > 1 && (
        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 rounded px-1.5 py-0.5 whitespace-nowrap">
          <CalendarRange size={10} /> Day {job.bookingPosition.day} of {job.bookingPosition.of}
        </span>
      )}
      {job.repeat && (
        <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-700 bg-teal-50 rounded px-1.5 py-0.5 whitespace-nowrap">
          <Repeat size={10} /> {job.repeat}
        </span>
      )}
    </>
  )

  const subline = (
    <>
      {job.client?.name && <span className={cn(search && "font-semibold text-foreground/80")}><Highlight text={job.client.name} term={search} /></span>}
      {job.client?.name && (site || job.location) && <span aria-hidden>·</span>}
      {(site || job.location) && (
        <span className="inline-flex items-center gap-1 min-w-0">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate"><Highlight text={site || job.location?.split(",")[0] || ""} term={search} /></span>
        </span>
      )}
    </>
  )

  const time = allDay ? (
    <span className="inline-block text-[11px] font-bold text-muted-foreground bg-muted rounded-md px-2 py-0.5">All day</span>
  ) : (
    <div className="tabular-nums">
      <p className="text-sm font-bold">{job.startTime}</p>
      <p className={cn("text-xs", brokenTime ? "text-red-600 font-semibold" : "text-muted-foreground")}>
        → {job.endTime} · {hoursLabel(job.minutes)}
      </p>
    </div>
  )

  const menu = (
    <div onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Actions for ${job.title}`} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={open}><Eye size={14} /> View details</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to={`/jobs/${job._id}/edit`}
              title={locked ? "This job has already happened — its date, time and rates are locked, but everything else can still be edited" : undefined}
            >
              <Pencil size={14} /> Edit job
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={duplicate.isPending} onSelect={() => duplicate.mutate(0)}><Copy size={14} /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem disabled={duplicate.isPending} onSelect={() => duplicate.mutate(7)}><CopyPlus size={14} /> Copy to next week</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => { if (window.confirm(`Delete "${job.title}"?`)) deleteJob(job._id as string).catch(() => {}) }}
          >
            <Trash2 size={14} /> Delete job
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      <div
        role="row"
        onClick={open}
        className={cn(
          "group cursor-pointer border-b border-[var(--border)]/60 last:border-b-0 transition-colors hover:bg-muted/40",
          selected && "bg-blue-50/50 hover:bg-blue-50/70",
          isPast && !selected && "opacity-60"
        )}
      >
        {/* Desktop / tablet: one aligned row */}
        <div className="hidden md:grid grid-cols-[20px_96px_minmax(0,1fr)_minmax(180px,230px)_minmax(150px,190px)_92px_32px] items-center gap-4 px-4 lg:px-5 py-3">
          <div onClick={e => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={v => onSelect(!!v)}
              aria-label={`Select ${job.title}`}
              className={cn(!selected && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
            />
          </div>
          {time}
          <div className="flex gap-3 min-w-0 items-stretch">
            <span className="w-1 rounded-full shrink-0" style={{ background: colourFor(job.client?._id ?? job.client?.name ?? job.title) }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[14.5px] truncate"><Highlight text={job.title} term={search} /></p>
                {badges}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 min-w-0">{subline}</div>
              {brokenTime && upcoming && (
                <p className="flex items-center gap-1 text-xs font-semibold text-red-600 mt-1">
                  <AlertTriangle size={12} /> Start and end time are the same
                </p>
              )}
              {job.attention?.includes("draft_soon") && (
                <p className="flex items-center gap-1 text-xs font-semibold text-amber-700 mt-1">
                  <AlertTriangle size={12} /> Still a draft — workers haven't been told
                </p>
              )}
            </div>
          </div>
          <Staffing job={job} />
          <div><StatusPill job={job} isPast={isPast} /></div>
          <div>{action}</div>
          {menu}
        </div>

        {/* Mobile: compact card */}
        <div className="md:hidden flex gap-3 px-3 py-3">
          <span className="w-1 rounded-full shrink-0" style={{ background: colourFor(job.client?._id ?? job.client?.name ?? job.title) }} />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <div onClick={e => e.stopPropagation()} className="pt-0.5">
                <Checkbox checked={selected} onCheckedChange={v => onSelect(!!v)} aria-label={`Select ${job.title}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold tabular-nums">
                  {allDay ? "All day" : <>{job.startTime}–<span className={cn(brokenTime && "text-red-600")}>{job.endTime}</span> · {hoursLabel(job.minutes)}</>}
                </p>
                <p className="font-semibold text-[15px] leading-snug"><Highlight text={job.title} term={search} /></p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">{subline}</div>
              </div>
              {menu}
            </div>
            {(job.priority === "high" || job.priority === "urgent" || job.bookingPosition || job.repeat) && (
              <div className="flex flex-wrap gap-1.5">{badges}</div>
            )}
            {brokenTime && upcoming && (
              <p className="flex items-center gap-1 text-xs font-semibold text-red-600"><AlertTriangle size={12} /> Start and end time are the same</p>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Staffing job={job} />
              <StatusPill job={job} isPast={isPast} />
            </div>
            {action && <div className="pt-0.5">{action}</div>}
          </div>
        </div>
      </div>

      {assignOpen && (
        <AssignWorkersModal
          jobId={job._id as string}
          assignedWorkers={job.workers}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
    </>
  )
}
