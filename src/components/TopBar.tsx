import { Button } from '@base-ui/react/button'
import { Search, Bell, Plus, PanelLeft, Menu } from 'lucide-react'

interface TopBarProps {
  onNewJob: () => void
  onToggleSidebar: () => void
  onNavigate: (id: string) => void
}

export function TopBar({ onNewJob, onToggleSidebar, onNavigate }: TopBarProps) {
  return (
    <header className="h-[60px] bg-white border-b border-[#E2E8F0] flex items-center px-5 gap-4 sticky top-0 z-20">
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <PanelLeft size={16} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search jobs, workers, locations..."
          className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono bg-white border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
  
        <button
          onClick={() => onNavigate('notifications')}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>

        <Button onClick={onNewJob} >
          <Plus size={14} />
          New Job
        </Button>

      </div>

    </header>
  )
}
