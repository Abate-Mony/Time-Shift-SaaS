import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle2, AlertCircle, Flag, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/utils/api-request-functions'

const iconMap: Record<string, { icon: React.FC<{ size?: number; className?: string }>; bg: string; color: string }> = {
  job_accepted: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  job_declined: { icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-500' },
  job_completed: { icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  worker_checked_out: { icon: Flag, bg: 'bg-amber-50', color: 'text-amber-600' },
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.max(0, Math.round(diffMs / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

const notificationsQuery = (page: number) => ({
  queryKey: ['notifications', page],
  queryFn: () => getNotifications(page),
})

export function Notifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const { data, isPending } = useQuery(notificationsQuery(page))

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const openNotification = (n: NotificationItem) => {
    if (!n.isRead) readMutation.mutate(n._id)
    if (n.link) navigate(n.link)
  }

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="p-6 max-w-2xl animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isPending ? 'Loading…' : `${unreadCount} unread on this page · ${data?.total ?? 0} total`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => readAllMutation.mutate()}
          disabled={readAllMutation.isPending}
        >
          <Check size={13} /> Mark all read
        </Button>
      </div>

      {isPending ? (
        <div className="h-40 flex items-center justify-center text-sm text-slate-400">Loading notifications…</div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
            <Bell size={18} className="text-slate-300" />
          </div>
          <p className="text-sm text-slate-500">You're all caught up — nothing here yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(n => {
            const { icon: Icon, bg, color } = iconMap[n.type] ?? { icon: Bell, bg: 'bg-slate-50', color: 'text-slate-500' }
            return (
              <button
                key={n._id}
                onClick={() => openNotification(n)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors text-left w-full ${n.isRead ? 'bg-white border-[#E2E8F0] hover:bg-slate-50/60' : 'bg-white border-blue-200 ring-1 ring-blue-100 hover:bg-blue-50/30'}`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-5">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1 text-xs"
          >
            <ChevronLeft size={12} /> Previous
          </button>
          <span className="px-2 font-medium text-slate-600 text-xs">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="h-7 px-2.5 rounded-lg border border-[#E2E8F0] text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1 text-xs"
          >
            Next <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
