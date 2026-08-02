
function JobCard({
  job,
  onSelect,
  onAccept,
  onReject,
  onClock,
}: {
  job: (typeof jobs)[0]
  onSelect: () => void
  onAccept?: () => void
  onReject?: () => void
  onClock?: () => void
}) {
  const statusColor: Record<string, string> = {
    'in-progress': 'bg-blue-500',
    'assigned': 'bg-violet-500',
    'completed': 'bg-emerald-500',
    'pending': 'bg-amber-500',
  }
  const accent = statusColor[job.status] ?? 'bg-slate-400'

  return (
    <div
      className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
      onClick={onSelect}
    >
      {/* Accent stripe */}
      <div className={`h-1 ${accent}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 leading-snug">{job.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{job.company}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <Clock size={11} className="text-slate-400" />
            </div>
            {job.startTime} – {job.endTime}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <Timer size={11} className="text-slate-400" />
            </div>
            {job.hours}h shift
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 col-span-2">
            <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
              <MapPin size={11} className="text-slate-400" />
            </div>
            <span className="truncate">{job.location}</span>
          </div>
        </div>

        {job.notes && (
          <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">{job.notes}</p>
          </div>
        )}

        {/* Actions */}
        {job.status === 'assigned' && onAccept && onReject && (
          <div className="mt-4 grid grid-cols-2 gap-2.5" onClick={e => e.stopPropagation()}>
            <button
              onClick={onReject}
              className="h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <X size={14} /> Decline
            </button>
            <button
              onClick={onAccept}
              className="h-11 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/30"
            >
              <Check size={14} /> Accept
            </button>
          </div>
        )}

        {job.status === 'in-progress' && onClock && (
          <button
            onClick={e => { e.stopPropagation(); onClock() }}
            className="mt-4 w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1E3A5F]/25"
          >
            <Timer size={14} /> Continue Working
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
function HomeScreen({ onJobSelect, onClockIn, onViewJobs }: {
  onJobSelect: (id: string) => void
  onClockIn: () => void
  onViewJobs: () => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Header */}
      <div className="bg-[#1E3A5F] rounded-3xl p-5 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Avatar initials={worker.avatar} size="md" index={0} />
              <div>
                <p className="text-xs text-white/50 font-medium">{greeting}</p>
                <p className="text-base font-bold text-white leading-tight">{worker.name.split(' ')[0]}</p>
              </div>
            </div>
            <button className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <Bell size={16} className="text-white" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full border-2 border-[#1E3A5F]" />
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'This Week', value: `${worker.hoursThisWeek}h`, icon: Clock },
              { label: 'This Month', value: `${worker.hoursThisMonth}h`, icon: TrendingUp },
              { label: 'Jobs Done', value: worker.jobsCompleted, icon: Briefcase },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-[10px] text-white/50 mt-0.5 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active job banner */}
      {activeJob && (
        <div
          className="bg-blue-600 rounded-2xl p-4 text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          onClick={onClockIn}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Timer size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full pulse-dot" />
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">You're on the clock</p>
                </div>
                <p className="text-sm font-bold text-white leading-tight truncate max-w-[180px]">{activeJob.name.split('—')[0].trim()}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/60 shrink-0" />
          </div>
        </div>
      )}

      {/* Pending — action needed */}
      {pendingJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Action Required</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              {pendingJobs.length} pending
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {pendingJobs.slice(0, 2).map(job => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={() => onJobSelect(job.id)}
                onAccept={() => {}}
                onReject={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">Today's Shift</h2>
          <button onClick={onViewJobs} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
            View all <ArrowUpRight size={12} />
          </button>
        </div>

        {activeJob ? (
          <JobCard
            key={activeJob.id}
            job={activeJob}
            onSelect={() => onJobSelect(activeJob.id)}
            onClock={onClockIn}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Briefcase size={20} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No shifts today</p>
            <p className="text-xs text-slate-400">Check the Jobs tab for upcoming assignments</p>
          </div>
        )}
      </div>

      {/* This week */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3">This Week</h2>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400">{d.day}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative
                  ${d.date === 25 ? 'bg-[#1E3A5F] text-white' : d.hasShift ? 'bg-blue-50 text-blue-700' : 'text-slate-400'}`}>
                  {d.date}
                  {d.hasShift && d.date !== 25 && (
                    <span className="absolute -bottom-0.5 w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  )}
                </div>
                <span className="text-[9px] text-slate-400 font-medium">{d.hasShift ? `${d.hours}h` : '—'}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total this week</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{worker.hoursThisWeek}h <span className="text-sm font-normal text-slate-400">/ 40h target</span></p>
            </div>
            <div className="flex-1 max-w-[120px] ml-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E3A5F] rounded-full transition-all"
                  style={{ width: `${(worker.hoursThisWeek / 40) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 text-right">{Math.round((worker.hoursThisWeek / 40) * 100)}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Jobs Screen ──────────────────────────────────────────────────────────────
function JobsScreen({ onJobSelect, onClockIn }: {
  onJobSelect: (id: string) => void
  onClockIn: () => void
}) {
  const [tab, setTab] = useState<JobsTab>('pending')
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [rejected, setRejected] = useState<Set<string>>(new Set())

  const tabData = {
    pending: pendingJobs.filter(j => !accepted.has(j.id) && !rejected.has(j.id)),
    active: myJobs.filter(j => j.status === 'in-progress' || accepted.has(j.id)),
    completed: completedJobs,
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">My Jobs</h2>
        <p className="text-xs text-slate-400 mt-0.5">All your assignments in one place</p>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {([
          { id: 'pending', label: 'Pending', count: tabData.pending.length },
          { id: 'active', label: 'Active', count: tabData.active.length },
          { id: 'completed', label: 'Completed', count: tabData.completed.length },
        ] as { id: JobsTab; label: string; count: number }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center
                ${tab === t.id ? (t.id === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700') : 'bg-slate-200 text-slate-500'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="flex flex-col gap-3">
        {tab === 'pending' && tabData.pending.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <Check size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">All caught up!</p>
            <p className="text-xs text-slate-400">No pending job requests right now.</p>
          </div>
        )}

        {tab === 'pending' && tabData.pending.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onSelect={() => onJobSelect(job.id)}
            onAccept={() => setAccepted(s => new Set([...s, job.id]))}
            onReject={() => setRejected(s => new Set([...s, job.id]))}
          />
        ))}

        {tab === 'active' && tabData.active.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Briefcase size={20} className="text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">No active jobs</p>
            <p className="text-xs text-slate-400">Accept a job from Pending to start working.</p>
          </div>
        )}

        {tab === 'active' && tabData.active.map(job => (
          <JobCard
            key={job.id}
            job={job}
            onSelect={() => onJobSelect(job.id)}
            onClock={onClockIn}
          />
        ))}

        {tab === 'completed' && completedHistory.map((h, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="h-1 bg-emerald-500" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{h.job}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{h.date}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 shrink-0">£{h.pay}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} className="text-slate-400" />
                  {h.hours} hours worked
                </div>
                {h.rated ? (
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="currentColor" />)}
                  </div>
                ) : (
                  <button className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors">
                    Rate job →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Job Detail Screen ────────────────────────────────────────────────────────
function JobDetailScreen({ jobId, onBack, onStartWork }: {
  jobId: string
  onBack: () => void
  onStartWork: () => void
}) {
  const job = jobs.find(j => j.id === jobId)
  if (!job) return null

  const infoRows = [
    { icon: Clock, label: 'Shift Time', value: `${job.startTime} – ${job.endTime}` },
    { icon: Timer, label: 'Duration', value: `${job.hours} hours` },
    { icon: MapPin, label: 'Location', value: job.location },
    { icon: CalendarDays, label: 'Date', value: job.date },
    { icon: Briefcase, label: 'Client', value: job.company },
  ]

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
        <div className="bg-gradient-to-br from-[#1E3A5F] to-[#2D5A8E] p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-1.5">{job.company}</p>
                <h2 className="text-base font-bold text-white leading-snug">{job.name}</h2>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <Clock size={13} className="text-white/60" />
                <span className="text-sm font-bold text-white">{job.startTime}</span>
              </div>
              <div className="w-8 h-px bg-white/20" />
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <Clock size={13} className="text-white/60" />
                <span className="text-sm font-bold text-white">{job.endTime}</span>
              </div>
              <span className="text-xs text-white/40 ml-1">{job.hours}h</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-0">
          {infoRows.map((row, i) => (
            <div key={i} className={`flex items-center gap-3 py-3 ${i < infoRows.length - 1 ? 'border-b border-[#F8FAFC]' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <row.icon size={14} className="text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{row.label}</p>
                <p className="text-sm text-slate-800 font-medium truncate">{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Manager Note</p>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">{job.notes}</p>
        </div>
      )}

      {/* Navigate CTA */}
      <button className="w-full h-11 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
        <Navigation size={15} className="text-slate-500" />
        Get Directions
      </button>

      {/* Primary CTA */}
      {(job.status === 'in-progress' || job.status === 'assigned') && (
        <button
          onClick={onStartWork}
          className="w-full h-14 rounded-2xl bg-[#1E3A5F] text-white text-base font-bold hover:bg-[#162D4A] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#1E3A5F]/25 mt-1"
        >
          <Play size={18} fill="currentColor" />
          {job.status === 'in-progress' ? 'Continue Working' : 'Start Work'}
        </button>
      )}
    </div>
  )
}

// ─── Clock Screen ─────────────────────────────────────────────────────────────
function ClockScreen({ jobId, onBack, onDone }: {
  jobId: string | null
  onBack: () => void
  onDone: () => void
}) {
  const job = jobs.find(j => j.id === jobId) ?? activeJob
  const [clockState, setClockState] = useState<ClockState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [breakTime, setBreakTime] = useState(0)
  const [breaks, setBreaks] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)

  const startWork = () => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    setClockState('working')
  }

  const startBreak = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setBreakTime(s => s + 1), 1000)
    setBreaks(b => b + 1)
    setClockState('break')
  }

  const endBreak = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    setClockState('working')
  }

  const finish = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setClockState('done')
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

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
              <p className="text-sm text-white/70">{job?.name.split('—')[0].trim()}</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Time', value: fmtHours(elapsed) },
                { label: 'Break Time', value: fmtHours(breakTime) },
                { label: 'Breaks Taken', value: breaks },
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
                <button
                  onClick={() => setShowNote(true)}
                  className="w-full h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText size={15} className="text-slate-400" /> Add a Note
                </button>
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
              <button
                onClick={onDone}
                className="w-full h-12 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold hover:bg-[#162D4A] transition-colors mt-1"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      {clockState === 'idle' && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
      )}

      {/* Job context */}
      {job && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center shrink-0">
            <Briefcase size={14} className="text-[#1E3A5F]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-medium">Current Job</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{job.name}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-slate-400">Scheduled</p>
            <p className="text-xs font-bold text-slate-700">{job.startTime}–{job.endTime}</p>
          </div>
        </div>
      )}

      {/* Timer display */}
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
            {clockState === 'idle' && (
              <p className="text-xs font-semibold text-white/30 uppercase tracking-widest">Ready to Start</p>
            )}
          </div>

          {/* Main timer */}
          <p className="text-6xl font-bold text-white mono tracking-tighter mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtTime(clockState === 'break' ? breakTime : elapsed)}
          </p>
          <p className="text-xs text-white/25 font-medium">
            {clockState === 'break' ? 'break duration' : 'time elapsed'}
          </p>

          {/* Break info */}
          {clockState === 'working' && breakTime > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-1.5">
              <Coffee size={12} className="text-white/40" />
              <p className="text-xs text-white/40">Break: {fmtHours(breakTime)} · {breaks} taken</p>
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

      {/* Controls */}
      {clockState === 'idle' && (
        <button
          onClick={startWork}
          className="w-full h-16 rounded-2xl bg-emerald-500 text-white text-lg font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Play size={20} fill="currentColor" />
          </div>
          Start Work
        </button>
      )}

      {clockState === 'working' && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startBreak}
            className="h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold hover:bg-amber-100 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <Coffee size={16} /> Take Break
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
            className="w-full h-14 rounded-2xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
          >
            <RotateCcw size={16} /> Resume Work
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
            { label: 'Clocked In', value: job?.startTime ?? '--:--' },
            { label: 'Billable', value: fmtHours(elapsed - breakTime) },
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

// ─── Schedule Screen ──────────────────────────────────────────────────────────
function ScheduleScreen({ onJobSelect }: { onJobSelect: (id: string) => void }) {
  const upcoming = [...myJobs].filter(j => j.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Schedule</h2>
        <p className="text-xs text-slate-400 mt-0.5">Your upcoming assignments</p>
      </div>

      {/* Week strip */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700">Week of 21 July</p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400">{d.day}</span>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative transition-colors
                ${d.date === 25 ? 'bg-[#1E3A5F] text-white shadow-sm' : d.hasShift ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-slate-300 border border-slate-100'}`}>
                {d.date}
              </div>
              {d.hasShift && (
                <div className="flex flex-col gap-0.5 w-full">
                  {Array.from({ length: Math.ceil(d.hours! / 8) }).map((_, j) => (
                    <div key={j} className={`h-1 rounded-full ${d.date === 25 ? 'bg-[#1E3A5F]' : 'bg-blue-300'}`} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming jobs */}
      <h3 className="text-sm font-bold text-slate-700">Upcoming Shifts</h3>
      <div className="flex flex-col gap-3">
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-600">No upcoming shifts scheduled</p>
          </div>
        ) : (
          upcoming.map(job => (
            <JobCard key={job.id} job={job} onSelect={() => onJobSelect(job.id)} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
