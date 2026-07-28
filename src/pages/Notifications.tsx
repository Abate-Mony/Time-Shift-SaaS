import { Bell, CheckCircle2, AlertCircle, Info, Check } from 'lucide-react'
import { notifications } from '../data/mockData'
import { Button } from '@/components/ui/button';

const iconMap: Record<string, { icon: React.FC<{ size?: number; className?: string }>; bg: string; color: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  warning: { icon: AlertCircle, bg: 'bg-amber-50', color: 'text-amber-600' },
  alert: { icon: Bell, bg: 'bg-blue-50', color: 'text-blue-600' },
  info: { icon: Info, bg: 'bg-slate-50', color: 'text-slate-500' },
}

export function Notifications() {
  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{notifications.filter(n => !n.read).length} unread notifications</p>
        </div>
        <Button variant="ghost" size="sm">
          <Check size={13} /> Mark all read
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.map(n => {
          const { icon: Icon, bg, color } = iconMap[n.type] ?? iconMap.info
          return (
            <div key={n.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${n.read ? 'bg-white border-[#E2E8F0]' : 'bg-white border-blue-200 ring-1 ring-blue-100'}`}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-sm text-slate-600">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1.5">{n.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
