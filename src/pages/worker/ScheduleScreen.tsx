import JobCard from "@/components/JobCard"
import { jobs } from "@/data/mockData"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ScheduleScreen() {
  const upcoming = [...jobs].filter(j => j.status !== 'completed').sort((a, b) => a.date.localeCompare(b.date))
   const weekDays = [
        { day: 'M', date: 21, hasShift: false },
        { day: 'T', date: 22, hasShift: true, hours: 8 },
        { day: 'W', date: 23, hasShift: true, hours: 12 },
        { day: 'T', date: 24, hasShift: true, hours: 8 },
        { day: 'F', date: 25, hasShift: true, hours: 8 },
        { day: 'S', date: 26, hasShift: false },
        { day: 'S', date: 27, hasShift: true, hours: 12 },
    ]
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
            <JobCard key={job.id} job={job} />
          ))
        )}
      </div>
    </div>
  )
}