import { Search, Bell, Plus, PanelLeft, Menu } from 'lucide-react'
import { Button } from './ui/button'
import { Link } from 'react-router'
import SearchComponent from './Search'

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
      <div className="relative flex-1 max-w-md items-center item-center flex">
       
        <SearchComponent
        type='search'
        placeholder='search jobs,workers,invoices,location,users ' containerClassName='my-2'/>
      </div>

      <div className="flex items-center gap-2 ml-auto">

        <button
          onClick={() => onNavigate('/notifications')}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white" />
        </button>
        <Link to={"/create-job"}>
          <Button variant={"outline"} size={"lg"}>
            <Plus size={10} />
            New Job
          </Button>
        </Link>

      </div>

    </header>
  )
}
