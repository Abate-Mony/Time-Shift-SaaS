import { useState } from 'react'
import { Search, Plus, Mail, Phone, Clock, Briefcase, Star, ChevronRight, X } from 'lucide-react'
import { Avatar, StatusBadge, Button, Card } from '../components/ui'
import { workers, jobs } from '../data/mockData'
import { useNavigate } from 'react-router'

export function Workers() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.role.toLowerCase().includes(search.toLowerCase())
  )

  const selectedWorker = workers.find(w => w.id === selected)
  const workerJobs = selectedWorker ? jobs.filter(j => j.workers.includes(selectedWorker.id)) : []
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workers.length} team members across all locations</p>
        </div>
        <Button size="sm"><Plus size={14} /> Add Worker</Button>
      </div>

      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search workers..."
              className="w-full h-9 pl-9 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filtered.map((worker, i) => (
              <Card
                key={worker.id}
                onClick={() => setSelected(selected === worker.id ? null : worker.id)}
                className={`p-4 transition-all ${selected === worker.id ? 'border-blue-300 ring-1 ring-blue-200' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar initials={worker.avatar} size="lg" index={i} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-900">{worker.name}</p>
                      <StatusBadge status={worker.status} />
                    </div>
                    <p className="text-xs text-slate-500">{worker.role} · {worker.location}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} />{worker.hoursThisWeek}h this week
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Briefcase size={11} />{worker.jobsCompleted} jobs done
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <Star size={11} fill="currentColor" />{worker.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <Mail size={14} />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                      <Phone size={14} />
                    </button>
                    <ChevronRight size={14} className={`text-slate-300 transition-transform ${selected === worker.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Worker detail panel */}
        {selectedWorker && (
          <div className="w-80 shrink-0 animate-slide-in">
            <Card className="p-5 sticky top-[76px]">
              <div className="flex items-start justify-between mb-4">
                <Avatar initials={selectedWorker.avatar} size="xl" index={workers.findIndex(w => w.id === selectedWorker.id)} />
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={14} />
                </button>
              </div>

              <h2 className="text-base font-semibold text-slate-900">{selectedWorker.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{selectedWorker.role}</p>
              <div className="mt-2"><StatusBadge status={selectedWorker.status} /></div>

              <div className="mt-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  {selectedWorker.email}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  {selectedWorker.phone}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F1F5F9] grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-slate-900">{selectedWorker.hoursThisWeek}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">hrs/week</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{selectedWorker.jobsCompleted}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">jobs done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{selectedWorker.rating}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">rating</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Assigned Jobs</p>
                {workerJobs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">No jobs assigned</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {workerJobs.slice(0, 4).map(job => (
                      <div key={job.id} className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-700 font-medium truncate">{job.name}</p>
                        <StatusBadge status={job.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button size="sm" className="w-full">View Full Profile</Button>
                <Button variant="outline" size="sm" className="w-full">Assign to Job</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
