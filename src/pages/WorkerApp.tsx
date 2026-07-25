import { useState } from 'react'
import { MapPin, Clock, Play, Square, Pause, CheckCircle2, Camera, FileText, ChevronLeft, Timer } from 'lucide-react'
import { StatusBadge, Avatar } from '../components/ui'
import { jobs, workers } from '../data/mockData'

type WorkerView = 'list' | 'job-detail' | 'working'

export function WorkerApp() {
  const [view, setView] = useState<WorkerView>('list')
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [workState, setWorkState] = useState<'idle' | 'working' | 'paused' | 'done'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null)
  const worker = workers[0]
  const myJobs = jobs.filter(j => j.workers.includes(worker.id))
  const currentJob = jobs.find(j => j.id === selectedJob)

  const startTimer = () => {
    const ref = setInterval(() => setSeconds(s => s + 1), 1000)
    setTimerRef(ref)
    setWorkState('working')
  }

  const pauseTimer = () => {
    if (timerRef) clearInterval(timerRef)
    setTimerRef(null)
    setWorkState('paused')
  }

  const finishWork = () => {
    if (timerRef) clearInterval(timerRef)
    setTimerRef(null)
    setWorkState('done')
  }

  const fmt = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="p-6 animate-fade-in">
      <div className="max-w-sm mx-auto">
        {/* Worker header */}
        <div className="flex items-center gap-3 mb-6">
          <Avatar initials={worker.avatar} size="lg" index={0} />
          <div>
            <p className="text-base font-semibold text-slate-900">{worker.name}</p>
            <p className="text-sm text-slate-500">{worker.role}</p>
          </div>
          <StatusBadge status={worker.status} />
        </div>

        {view === 'list' && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'This Week', value: `${worker.hoursThisWeek}h` },
                { label: 'This Month', value: `${worker.hoursThisMonth}h` },
                { label: 'Jobs Done', value: worker.jobsCompleted },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-3.5 text-center">
                  <p className="text-lg font-bold text-slate-900">{s.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <h2 className="text-sm font-semibold text-slate-700 mb-3">My Assignments</h2>
            <div className="flex flex-col gap-3">
              {myJobs.map(job => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-[#E2E8F0] p-5 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
                  onClick={() => { setSelectedJob(job.id); setView('job-detail') }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{job.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={12} className="text-slate-400" />
                      {job.location.split(',')[0]}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} className="text-slate-400" />
                      {job.date} · {job.startTime} – {job.endTime} · {job.hours}h
                    </div>
                  </div>
                  {job.status === 'assigned' && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button className="h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors">
                        ✓ Accept
                      </button>
                      <button className="h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {job.status === 'in-progress' && (
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedJob(job.id); setView('working') }}
                      className="mt-4 w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2"
                    >
                      <Timer size={15} /> Continue Working
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'job-detail' && currentJob && (
          <div className="animate-fade-in">
            <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
              <ChevronLeft size={14} /> Back to jobs
            </button>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 mb-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-bold text-slate-900 leading-snug">{currentJob.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{currentJob.company}</p>
                </div>
                <StatusBadge status={currentJob.status} />
              </div>

              <div className="flex flex-col gap-3 border-t border-[#F1F5F9] pt-4">
                {[
                  { icon: MapPin, label: 'Location', value: currentJob.location },
                  { icon: Clock, label: 'Date', value: currentJob.date },
                  { icon: Clock, label: 'Time', value: `${currentJob.startTime} – ${currentJob.endTime}` },
                  { icon: Timer, label: 'Duration', value: `${currentJob.hours} hours` },
                ].map(r => (
                  <div key={r.label} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                      <r.icon size={13} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{r.label}</p>
                      <p className="text-sm text-slate-800 font-medium">{r.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {currentJob.notes && (
                <div className="mt-4 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                  <p className="text-xs text-amber-800">{currentJob.notes}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => { setView('working'); setWorkState('idle') }}
              className="w-full h-14 rounded-2xl bg-[#1E3A5F] text-white text-base font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#1E3A5F]/25"
            >
              <Play size={18} fill="currentColor" /> Start Work
            </button>
          </div>
        )}

        {view === 'working' && currentJob && (
          <div className="animate-fade-in">
            <button onClick={() => setView('job-detail')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors">
              <ChevronLeft size={14} /> {currentJob.name.split('—')[0].trim()}
            </button>

            {workState === 'done' ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Work Complete!</h2>
                <p className="text-sm text-slate-500 mb-2">Total time: <span className="font-semibold text-slate-800">{fmt(seconds)}</span></p>
                <p className="text-xs text-slate-400 mb-6">Your hours have been recorded automatically.</p>

                <div className="flex flex-col gap-3">
                  <button className="w-full h-12 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                    <Camera size={15} /> Upload Photos
                  </button>
                  <button className="w-full h-12 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2">
                    <FileText size={15} /> Add Notes
                  </button>
                  <button onClick={() => setView('list')} className="w-full h-12 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Timer display */}
                <div className="bg-[#0F172A] rounded-3xl p-8 text-center mb-5">
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-3">Time Elapsed</p>
                  <p className="text-5xl font-bold text-white mono tracking-tight mb-3">{fmt(seconds)}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${workState === 'working' ? 'bg-emerald-400 pulse-dot' : 'bg-slate-600'}`} />
                    <p className="text-sm text-white/50">{workState === 'working' ? 'Recording…' : workState === 'paused' ? 'Paused' : 'Ready to start'}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-4 flex items-center gap-3">
                  <MapPin size={14} className="text-slate-400" />
                  <p className="text-sm text-slate-700 truncate">{currentJob.location}</p>
                </div>

                {workState === 'idle' && (
                  <button
                    onClick={startTimer}
                    className="w-full h-16 rounded-2xl bg-emerald-500 text-white text-lg font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30"
                  >
                    <Play size={22} fill="currentColor" /> Start Work
                  </button>
                )}

                {workState === 'working' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={pauseTimer}
                      className="h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Pause size={16} /> Pause
                    </button>
                    <button
                      onClick={finishWork}
                      className="h-14 rounded-2xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2"
                    >
                      <Square size={14} fill="currentColor" /> Finish Work
                    </button>
                  </div>
                )}

                {workState === 'paused' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={startTimer}
                      className="h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Play size={16} fill="currentColor" /> Resume
                    </button>
                    <button
                      onClick={finishWork}
                      className="h-14 rounded-2xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors flex items-center justify-center gap-2"
                    >
                      <Square size={14} fill="currentColor" /> Finish Work
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
