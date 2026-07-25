import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { CreateJob } from './pages/CreateJob'
import { Workers } from './pages/Workers'
import { Calendar } from './pages/Calendar'
import { Reports } from './pages/Reports'
import { Notifications } from './pages/Notifications'
import { Settings } from './pages/Settings'
import { WorkerApp } from './pages/WorkerApp'
import { Locations } from './pages/Locations'
import { Messages } from './pages/Messages'

type Page =
  | 'dashboard'
  | 'jobs'
  | 'create-job'
  | 'workers'
  | 'calendar'
  | 'locations'
  | 'messages'
  | 'reports'
  | 'timesheets'
  | 'analytics'
  | 'billing'
  | 'notifications'
  | 'settings'
  | 'help'
  | 'worker-app'

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navigate = (id: string) => setPage(id as Page)

  const sidebarWidth = sidebarCollapsed ? 64 : 240

  // Pages that don't use the normal layout (full-bleed)
  const isFullBleed = page === 'messages'

  return (
    <div className="flex h-screen  overflow-hidden bg-[#F8FAFC]">
      <Sidebar active={page} onNavigate={navigate} collapsed={sidebarCollapsed} />

      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Mode switcher pill */}
        <div className="fixed top-3 right-3 z-40">
          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setPage('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${page !== 'worker-app' ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Manager
            </button>
            <button
              onClick={() => setPage('worker-app')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${page === 'worker-app' ? 'bg-[#1E3A5F] text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Worker
            </button>
          </div>
        </div>

        {page === 'worker-app' ? (
          <div className="flex-1 overflow-y-auto">
            <WorkerApp />
          </div>
        ) : (
          <>
            <TopBar
              onNewJob={() => navigate('create-job')}
              onToggleSidebar={() => setSidebarCollapsed(c => !c)}
              onNavigate={navigate}
            />
            <main className={`flex-1 overflow-y-auto ${isFullBleed ? '' : ''}`}>
              {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
              {page === 'jobs' && <Jobs onNavigate={navigate} />}
              {page === 'create-job' && <CreateJob onNavigate={navigate} />}
              {page === 'workers' && <Workers onNavigate={navigate} />}
              {page === 'calendar' && <Calendar />}
              {page === 'locations' && <Locations />}
              {page === 'messages' && <Messages />}
              {page === 'reports' && <Reports />}
              {page === 'timesheets' && <Reports />}
              {page === 'analytics' && <Dashboard onNavigate={navigate} />}
              {page === 'notifications' && <Notifications />}
              {page === 'settings' && <Settings />}
              {page === 'billing' && <Settings />}
              {page === 'help' && <HelpPage />}
            </main>
          </>
        )}
      </div>
    </div>
  )
}

function HelpPage() {
  const articles = [
    { section: 'Getting Started', items: ['Creating your first job', 'Inviting workers to your team', 'Setting up locations', 'Understanding the dashboard'] },
    { section: 'Jobs & Assignments', items: ['How to assign workers to a job', 'Job statuses explained', 'Editing and cancelling jobs', 'Recurring job templates'] },
    { section: 'Time Tracking', items: ['How workers clock in and out', 'Break tracking', 'Editing time records', 'GPS verification'] },
    { section: 'Reports & Payroll', items: ['Generating weekly timesheets', 'Exporting payroll to CSV/PDF', 'Worker performance reports', 'Overtime calculations'] },
  ]
  return (
    <div className="p-6 max-w-3xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Help Centre</h1>
        <p className="text-sm text-slate-500 mt-0.5">Find answers and learn how to use work.wrk</p>
      </div>

      <div className="relative mb-6">
        <input
          placeholder="Search help articles..."
          className="w-full h-11 pl-5 pr-5 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {articles.map(section => (
          <div key={section.section} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">{section.section}</h3>
            <div className="flex flex-col gap-1.5">
              {section.items.map(item => (
                <button key={item} className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors py-0.5">
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-[#0F172A] rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white mb-1">Still need help?</p>
          <p className="text-xs text-white/50">Our support team typically responds within 2 hours.</p>
        </div>
        <button className="h-10 px-5 bg-white text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shrink-0">
          Contact Support
        </button>
      </div>
    </div>
  )
}
