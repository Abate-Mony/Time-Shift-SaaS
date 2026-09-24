import ToggleTheme from "@/components/ToggleTheme";
import { Avatar, StatusBadge } from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Scrollable } from "@/components/ui/scrollable";
import { queryClient } from "@/lib/queryClient";
import { requestAccountDeletion } from "@/utils/api-request-functions";
import customFetch from "@/utils/customFetch";
import { logoutUser } from "@/utils/logout";
import type { User } from "@/utils/types";
import type { WorkerDashboardStats } from "@/utils/types/workerType";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle2, ChevronRight, Clock, Download, HelpCircle, LogOut, MapPin, Paperclip, Phone, Star, Trash2, Zap } from "lucide-react";
import { useNavigate, useOutletContext, type LoaderFunctionArgs } from "react-router";

export const workerDashboardstats = () => {
  return ({
    queryKey: ["worker-dashboard-stats"],
    queryFn: async () => {
      const { data } = await customFetch.get<WorkerDashboardStats>(`/workers/stats`)
      return data
    }
  })
}
export const loader = async ({ params }: LoaderFunctionArgs) => {
  return await queryClient.ensureQueryData(workerDashboardstats())
}

export function ProfileScreen() {
  const navigate = useNavigate()
  const user = useOutletContext<{
    user: User
  }>()?.user
  const {
    jobStats,

    monthly
    ,
    totalJobs
  } = useQuery(workerDashboardstats()).data as WorkerDashboardStats

  const job_completed = Object.values(jobStats!).reduce((acc, next) => acc + next);
  // console.log("total hours ",total_hours)
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Profile hero */}
      <div className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="h-20 bg-gradient-to-r from-[var(--primary)] to-[#2D5A8E]" />
        <div className="px-5 pb-5">
          <div className="-mt-8 mb-4 flex items-end justify-between">
            <div className="ring-4 ring-white rounded-full">
              <Avatar initials={user?.fullname?.slice(0, 3)} size="xl" index={0} src={user?.profilePhoto?.url} />
            </div>
            <div className="flex items-center gap-x-1.5">
              <button
              type="button"
              onClick={() => navigate('/worker/profile/edit')}
              className="h-8 px-3.5 rounded-lg border border-[var(--border)] text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Edit Profile
            </button>
            <div className="px-2 pt-2 flex justify-end">
              <ToggleTheme />
            </div>
            </div>
          </div>
          <h2 className="text-base font-bold text-foreground">{user?.fullname}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{user?.role}</p>
          <div className="flex items-center gap-2 mt-2">
            {/* <StatusBadge status={"user?.status"} /> */}
            {/* <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
              <Star size={12} fill="currentColor" /> {"user?.rating"} rating
            </span> */}
          </div>
          <div className="flex- hidden items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin size={11} />{"user?.location"}</span>
            <span className="flex items-center gap-1.5"><Phone size={11} />{"user?.phone"}</span>
          </div>
        </div>
      </div>

      {/* Earnings card */}
      <div className="bg-[var(--primary)] rounded-2xl p-5 relative overflow-hidden">
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

      {/* Stats */}
      <Scrollable>

        {[
          { label: 'Total Jobs', value: job_completed, sub: 'this month', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Job Completed', value: `${jobStats.completed}`, sub: 'this month', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Job Decline', value: `${jobStats.declined}`, sub: 'this month', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Job Inprogress', value: `${jobStats["in-progress"]}`, sub: 'this month', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Job Pending', value: `${jobStats["pending"]}`, sub: 'this month', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Job Accepted', value: `${jobStats["accepted"]}`, sub: 'this month', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(s => (
          <div key={s.label} className="bg-card flex-none w-full max-w-[min(200px,calc(100%-2rem))] rounded-2xl border border-[var(--border)] p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</p>
            <p className="text-[10px] text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </Scrollable>

      {/* Settings list */}
      <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
        {[
          { label: 'Download Timesheet', icon: Download, sub: 'July 2025', to: "/worker/profile/download-time-sheet" },
          { label: 'My Documents', icon: Paperclip, sub: 'ID, right-to-work, certifications', to: "/worker/profile/documents" },
          { label: 'Notification Preferences', icon: Bell, sub: 'Job alerts, reminders', to: '/worker/profile/notifications' },
          { label: 'Help Centre', icon: HelpCircle, sub: 'Guides and answers', to: '/worker/help' },
          { label: 'Contact Manager', icon: Phone, sub: 'Get in touch', to: undefined },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => item.to && navigate(item.to)}
            className={`w-full flex items-center gap-3.5 px-5 py-4 hover:bg-muted transition-colors text-left border-b border-border}`}
          >
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <item.icon size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.sub}</p>
            </div>
            <ChevronRight size={14} className="text-slate-300" />
          </button>
        ))}
        <AlertDialog>
          <AlertDialogTrigger className="w-full  flex items-center gap-3.5 px-5 py-4 hover:bg-muted transition-colors text-left border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <LogOut size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-rose-600">logout</p>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.fullname}</p>
            </div>
            <LogOut size={14} className="text-amber-500" />
          </AlertDialogTrigger>
          <AlertDialogContent className=" max-w-[min(400px,calc(100%-1rem))] rounded-sm">
            <AlertDialogHeader>
              <LogOut size={30} className="mx-auto text-amber-800" />
              <AlertDialogTitle className="text-xl text-center">LogOut </AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Do you want to logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-rose-400"
                onClick={logoutUser}
              >Log Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* This app has no in-app account creation (a company admin
            provisions every worker account), so there's nothing to
            self-service delete here either — this sends a documented
            request to the company's admin(s) instead. */}
        <AlertDialog>
          <AlertDialogTrigger className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-muted transition-colors text-left">
            <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Trash2 size={14} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">Request Account Deletion</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sends a request to your admin</p>
            </div>
            <Trash2 size={14} className="text-red-500" />
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[min(400px,calc(100%-1rem))] rounded-sm">
            <AlertDialogHeader>
              <Trash2 size={30} className="mx-auto text-red-700" />
              <AlertDialogTitle className="text-xl text-center">Request Account Deletion</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                This sends a request to your company admin to have your INPRN account deleted. This can't be undone once they action it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600"
                onClick={() => requestAccountDeletion()}
              >Send Request</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
