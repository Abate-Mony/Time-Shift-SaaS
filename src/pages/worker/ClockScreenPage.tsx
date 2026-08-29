import { Button } from "@/components/ui/button"
import GradientBorder from "@/components/ui/gradient-border"
import { queryClient } from "@/lib/queryClient"
import { changeWorkerJobStaus, endWorkerBreak, startWorkerBreak } from "@/utils/api-request-functions"
import customFetch from "@/utils/customFetch"
import { formatSecondsAsClock, formatSecondsAsDuration } from "@/utils/date"
import type { CreateJobForm } from "@/utils/types"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { AnimatePresence, motion } from "framer-motion"
import { Briefcase, Camera, CheckCircle2, Coffee, FileText, Loader2, MapPin, RotateCcw, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { redirect } from "react-router"
type ClockState = 'working' | 'break' | 'done'

export const loader = async () => {
  // await wait()
  const { job } = await queryClient.ensureQueryData(activeWorkerJob())
  if (job === null) {
    console.log("active-job : ",job)
    return redirect("/worker/clock/no-active-job")
  }
  return job
}

function AnimatedDigits({ value }: { value: string }) {
  return (
    <span className="relative inline-block w-[2ch] h-[1em] align-bottom overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{
            duration: 0.25,
            opacity: {
              duration: 0.2
            }
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export const activeWorkerJob = () => {
  return ({
    queryKey: ["active-job"],
    queryFn: async (): Promise<{ success: true, job: null } | { job: CreateJobForm }> => {
      const { data } = await customFetch.get(`/workers/active-job`)
      return data
    }
  })
}
interface WorkerBreak {
  startedAt: string
  endedAt?: string | null
}
interface workerJobWithDetails extends CreateJobForm {
  workerJobDetails: {
    workerStatus: "pending" |
    "accepted" |
    "declined" |
    "in-progress" |
    "completed" |
    "cancelled",
    assignmentId: string,
    acceptedAt: string,
    declinedAt: string,
    checkedInAt: string,
    completedAt: string,
    // TODO(backend): not yet returned by GET /workers/active-job — add the
    // assignment's `breaks` array here so the clock screen can tell whether
    // the worker is currently on a break after a remount/refetch.
    breaks?: WorkerBreak[],
  }
}
export default function ClockScreen() {

  const job = useQuery(activeWorkerJob()).data?.job as workerJobWithDetails

  const onFinish = () => changeWorkerJobStaus(job._id!, "completed")
  const workerJobDetails = job?.workerJobDetails ?? {}
  const breaksList = workerJobDetails.breaks ?? []
  const openBreak = breaksList.find(b => !b.endedAt)

  const today = dayjs().format("YYYY-MM-DD");
  const scheduledStart = dayjs(`${today} ${job?.startTime}`);
  let scheduledEnd = dayjs(`${today} ${job?.endTime}`);

  // Handle overnight shifts
  if (scheduledEnd.isBefore(scheduledStart)) {
    scheduledEnd = scheduledEnd.add(1, "day");
  }

  const totalSeconds = scheduledEnd.diff(scheduledStart, "second");

  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [isBreakActionLoading, setIsBreakActionLoading] = useState(false)
  // Snapshot of the counters at the moment the shift is finished, so the
  // summary screen stops ticking once the job is done.
  const [doneSnapshot, setDoneSnapshot] = useState<{ elapsedSeconds: number; breakSeconds: number; breaksTaken: number } | null>(null)

  // A 1s heartbeat so elapsed/break time re-derive from real timestamps every
  // tick, instead of being tracked as counters that reset on remount.
  const [, forceTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const now = dayjs()
  const checkedInAt = dayjs(workerJobDetails.checkedInAt)
  const elapsedSeconds = Math.max(now.diff(checkedInAt, "second"), 0)
  const breakSeconds = breaksList.reduce((total, b) => {
    const breakStart = dayjs(b.startedAt)
    const breakEnd = b.endedAt ? dayjs(b.endedAt) : now
    return total + Math.max(breakEnd.diff(breakStart, "second"), 0)
  }, 0)
  const currentBreakSeconds = openBreak ? Math.max(now.diff(dayjs(openBreak.startedAt), "second"), 0) : 0

  const progress = Math.min(
    Math.max((elapsedSeconds / totalSeconds) * 100, 0),
    100
  );
  const clockState: ClockState = doneSnapshot ? 'done' : openBreak ? 'break' : 'working'

  const startBreak = async () => {
    setIsBreakActionLoading(true)
    await startWorkerBreak(job._id!)
    setIsBreakActionLoading(false)
  }

  const endBreak = async () => {
    setIsBreakActionLoading(true)
    await endWorkerBreak(job._id!)
    setIsBreakActionLoading(false)
  }

  const finish = () => {
    setDoneSnapshot({ elapsedSeconds, breakSeconds, breaksTaken: breaksList.length })
    onFinish()
  }

  if (clockState === 'done') {
    return (
      <div className="flex flex-col items-center pb-4 animate-fade-in">
        <div className="w-full bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm mb-4">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '20px 20px' }} />
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Shift Complete!</h2>
              <p className="text-sm text-white/70">{job?.title.split('—')[0].trim()}</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Time', value: formatSecondsAsDuration(doneSnapshot!.elapsedSeconds) },
                { label: 'Break Time', value: formatSecondsAsDuration(doneSnapshot!.breakSeconds) },
                { label: 'Breaks Taken', value: doneSnapshot!.breaksTaken },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-base font-bold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500 text-center mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
              ✓ Your hours have been recorded automatically and sent to your manager.
            </p>

            <div className="flex flex-col gap-2.5">
              <button className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                <Camera size={15} className="text-slate-400" /> Upload Site Photos
              </button>
              {!showNote ? (
                <Button
                  onClick={() => setShowNote(true)}
                  className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={15} className="text-slate-400" /> Add a Note
                </Button>
              ) : (
                <div>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Any notes for your manager..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
                  />
                </div>
              )}
              <Button
                className="w-full h-12 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors mt-1"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      {/* Job context */}
      {job && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
            <Briefcase size={14} className="text-[#1E3A5F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">Current Job</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{job.title}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400">Scheduled</p>
            <p className="text-xs font-bold text-slate-700">{job.startTime}–{job.endTime}</p>
          </div>
        </div>
      )}

      {/* Timer display */}
      <GradientBorder
        className=" w-full h-full bg-transparent py-0.5 "
        percentage={progress}
        colors={['#0066ff', '#0066ff', '#0066ff']}
        animate={false}
        borderRadius={20}
        strokeWidth={2.5}
        variant='default'
        active
        animationMode="once"
        lineCapStart="round"
        startPosition={0.0}
        antsDashWidth={1}
      >
        <div className={`rounded-3xl p-7 text-center relative overflow-hidden transition-colors duration-500
        ${clockState === 'working' ? 'bg-[#0F172A]' : clockState === 'break' ? 'bg-amber-900' : 'bg-[#0F172A]'}`}>
          {/* Pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)', backgroundSize: '22px 22px' }} />

          <div className="relative">
            {/* State indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {clockState === 'working' && (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                  <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Recording Hours</p>
                </>
              )}
              {clockState === 'break' && (
                <>
                  <span className="w-2 h-2 bg-amber-400 rounded-full pulse-dot" />
                  <p className="text-xs font-semibold text-amber-400/80 uppercase tracking-widest">On Break</p>
                </>
              )}
            </div>

            {/* Main timer */}
            <p className="text-6xl font-bold text-white mono tracking-tighter mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedDigits value={formatSecondsAsClock(clockState == "working" ? elapsedSeconds : currentBreakSeconds).h} />:
              <AnimatedDigits value={formatSecondsAsClock(clockState == "working" ? elapsedSeconds : currentBreakSeconds).m} />:
              <AnimatedDigits value={formatSecondsAsClock(clockState == "working" ? elapsedSeconds : currentBreakSeconds).s} />
            </p>
            <p className="text-xs text-white/25 font-medium">
              {clockState === 'break' ? 'break duration' : 'time elapsed'}
            </p>

            {/* Break info */}
            {clockState === 'working' && breakSeconds > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5">
                <Coffee size={12} className="text-white/40" />
                <p className="text-xs text-white/40">Break: {formatSecondsAsDuration(breakSeconds)} · {breaksList.length} taken</p>
              </div>
            )}

            {/* Location */}
            {job && (
              <div className="mt-5 flex items-center justify-center gap-1.5">
                <MapPin size={12} className="text-white/25" />
                <p className="text-xs text-white/25 truncate max-w-[220px]">{job.location}</p>
              </div>
            )}
          </div>
        </div>
      </GradientBorder>
      {/* Controls */}
      {clockState === 'working' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startBreak}
            disabled={isBreakActionLoading}
            className="h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold hover:bg-amber-100 active:scale-[0.97] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isBreakActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Coffee size={16} />} Take Break
          </button>
          <button
            onClick={finish}
            className="h-14 rounded-2xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25"
          >
            <Square size={14} fill="currentColor" /> Finish Work
          </button>
        </div>
      )}

      {clockState === 'break' && (
        <div className="flex flex-col gap-3">
          <button
            onClick={endBreak}
            disabled={isBreakActionLoading}
            className="w-full h-14 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isBreakActionLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Resume Work
          </button>
          <button
            onClick={finish}
            className="w-full h-11 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Square size={13} fill="currentColor" /> Finish Shift Instead
          </button>
        </div>
      )}

      {/* Live stats row */}
      {(clockState === 'working' || clockState === 'break') && (
        <div className="grid grid-cols-3 gap-3 mt-1">
          {[
            { label: 'Clocked In', value: dayjs(job?.workerJobDetails?.checkedInAt).format("HH:mm") ?? '--:--' },
            { label: 'Billable', value: formatSecondsAsDuration(elapsedSeconds - breakSeconds) },
            { label: 'Est. Finish', value: job?.endTime ?? '--:--' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-900 mono">{s.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
