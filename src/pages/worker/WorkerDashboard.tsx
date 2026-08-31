import { EmptyState } from "@/components/empty-state"
import JobCard from "@/components/JobCard"
import { Avatar } from "@/components/ui"
import { workers } from "@/data/mockData"
import type { User } from "@/utils/types"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Bell, Briefcase, ChevronRight, Clock, Timer, TrendingUp, Zap } from "lucide-react"
import { Link, useNavigate, useOutletContext } from "react-router"
import { activeWorkerJob } from "./ClockScreenPage"
import { Button } from "@/components/ui/button"
import type { WorkerDashboardStats } from "@/utils/types/workerType"
import { workerDashboardstats } from "./WorkerProfilepage"

export default function HomeScreen() {
    const worker = workers[0]
    const navigate = useNavigate()
    const activeJob = useQuery(activeWorkerJob()).data?.job
    // const pendingJobs = myJobs.filter(j => j.status === 'assigned')
    // const completedJobs = myJobs.filter(j => j.status === 'completed')

    const weekDays = [
        { day: 'M', date: 21, hasShift: false },
        { day: 'T', date: 22, hasShift: true, hours: 8 },
        { day: 'W', date: 23, hasShift: true, hours: 12 },
        { day: 'T', date: 24, hasShift: true, hours: 8 },
        { day: 'F', date: 25, hasShift: true, hours: 8 },
        { day: 'S', date: 26, hasShift: false },
        { day: 'S', date: 27, hasShift: true, hours: 12 },
    ]
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const user = useOutletContext<{
        user: User
    }>()?.user
      const {
        jobStats,
    
        monthly
        ,
        totalJobs
      } = useQuery(workerDashboardstats()).data as WorkerDashboardStats
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
                            <Avatar initials={user?.fullname?.slice(0, 2)} size="md" index={0} />
                            <div>
                                <p className="text-xs text-white/50 font-medium">{greeting}</p>
                                <p className="text-base font-bold text-white leading-tight">{user?.fullname.split(' ')[0]}</p>
                            </div>
                        </div>
                        <button className="relative w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Bell size={16} className="text-white" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full border-2 border-[#1E3A5F]" />
                        </button>
                    </div>

                    {/* Stats row */}
                    {/* Earnings card */}
                    <div className="bg-[#1E3A5F] rounded-2xl p-5 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.04]"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">Earnings This Month</p>
                                    <p className="text-3xl font-bold text-white mt-1">£{monthly.earnings}</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Zap size={18} className="text-blue-300" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Hours', value: `${monthly.hoursWorked?.toFixed(1)}h` },
                                    { label: 'Jobs', value: jobStats.completed },
                                    { label: '£/hr avg', value: monthly.averagePayRate || 2 },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center">
                                        <p className="text-base font-bold text-white">{s.value}</p>
                                        <p className="text-[10px] text-white/40 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* <div className="grid grid-cols-3 gap-3">
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
                    </div> */}
                </div>
            </div>

            {/* Active job banner */}
            {activeJob && (
                <div
                    onClick={() => navigate('/worker/clock')}
                    className="bg-blue-600 rounded-2xl p-4 text-white cursor-pointer hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
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
                                <p className="text-sm font-bold text-white leading-tight truncate max-w-[180px]">{activeJob.title.split('—')[0].trim()}</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-white/60 shrink-0" />
                    </div>
                </div>
            )}

            {/* Pending — action needed */}
            {/* {pendingJobs.length > 0 && (
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
                                onAccept={() => { }}
                                onReject={() => { }}
                            />
                        ))}
                    </div>
                </div>
            )} */}

            Today's schedule
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-800">Today's Shift</h2>
                    <Link to={"/worker/jobs"}>

                        <Button variant={"link"} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
                            View all <ArrowUpRight size={12} />
                        </Button></Link>
                </div>

            </div>

            {activeJob ? (
                <JobCard
                    job={activeJob}
                />
            ) : (<EmptyState
                icon={<Briefcase size={20} />}
                // action={
                //     <p>
                //         browse jobs <Link to={"/worker/jobs"}><Button variant={"link"} className={""}> here </Button></Link>
                //     </p>
                // }
                title="No Shifts Today"
                description="Check the Jobs tab for upcoming assignments"
            />


            )}

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
