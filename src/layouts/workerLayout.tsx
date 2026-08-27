import BottomNav from '@/components/ui/BottomNav'
import { activeWorkerJob } from '@/pages/worker/ClockScreenPage'
import customFetch from '@/utils/customFetch'
import { formatSecondsAsDuration } from '@/utils/date'
import { ensureNotificationPermission } from '@/utils/notifications'
import { ensurePushSubscription } from '@/utils/pushSubscription'
import ScrollToTop from '@/utils/scroll-to-top'
import type { CreateJobForm } from '@/utils/types'
import { QueryClient, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useRef } from 'react'
import { Outlet, redirect, useLocation, useNavigate, useNavigation } from 'react-router'

// // ─── Types ──────────────────────────────────────────────────────────────────
// type WorkerTab = '/' | 'jobs' | 'clock' | 'schedule' | 'profile'
// type JobsTab = 'pending' | 'active' | 'completed'
// type ClockState = 'idle' | 'working' | 'break' | 'done'

// ─── Data ───────────────────────────────────────────────────────────────────
// const worker = workers[0]
// const myJobs = jobs.filter(j => j.workers.includes(worker.id))


// const weekDays = [
//   { day: 'M', date: 21, hasShift: false },
//   { day: 'T', date: 22, hasShift: true, hours: 8 },
//   { day: 'W', date: 23, hasShift: true, hours: 12 },
//   { day: 'T', date: 24, hasShift: true, hours: 8 },
//   { day: 'F', date: 25, hasShift: true, hours: 8 },
//   { day: 'S', date: 26, hasShift: false },
//   { day: 'S', date: 27, hasShift: true, hours: 12 },
// ]

// const completedHistory = [
//   { date: '24 Jul', job: 'Excel Centre — Event Staffing', hours: 12, pay: 216, rated: true },
//   { date: '23 Jul', job: 'Waterloo — Crowd Management', hours: 8, pay: 144, rated: false },
//   { date: '22 Jul', job: 'Heathrow T5 — Security', hours: 8, pay: 144, rated: true },
//   { date: '21 Jul', job: 'Canary Wharf — Day Patrol', hours: 8, pay: 144, rated: true },
// ]

// ─── Utilities ──────────────────────────────────────────────────────────────
// function fmtTime(s: number) {
//   const h = Math.floor(s / 3600)
//   const m = Math.floor((s % 3600) / 60)
//   const sec = s % 60
//   return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
// }

// function fmtHours(s: number) {
//   const h = Math.floor(s / 3600)
//   const m = Math.floor((s % 3600) / 60)
//   if (h === 0) return `${m}m`
//   return m > 0 ? `${h}h ${m}m` : `${h}h`
// }

// ─── Sub-components ──────────────────────────────────────────────────────────

// ─── Bottom Nav ────────────────────────────────────────────────────────────────
// function BottomNav() {
//   const tabs: { id: WorkerTab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
//     { id: '/', label: 'Home', Icon: Home, },
//     { id: 'jobs', label: 'Jobs', Icon: Briefcase },
//     { id: 'clock', label: 'Clock', Icon: Timer },
//     { id: 'schedule', label: 'Schedule', Icon: CalendarDays },
//     { id: 'profile', label: 'Profile', Icon: User },
//   ]

//   return (
//     <div className="bg-white border-t max-w-md px-2  rounded-t-lg w-full fixed bottom-0 border-[#E2E8F0]   pb-3 grid grid-cols-5 shrink-0">
//       {tabs.map(t => (
//         <CustomNavLink
//           end={t.label == "Home"}
//           animateClassName="size-full h-px bottom-0 bg-black/40 ho rounded-full"

//           to={t.id === "/" ? "/worker" : `/worker/${t.id}`}
//           key={t.id}
//           className={({ isActive }) => cn("flex flex-col items-center rounded-t-full h-auto gap-1 py-1.5 px-2 transition-all duration-500 bg-white"

//             ,
//             isActive && "-translate-y-4 inset-shadow-sm",
//             t.id == "clock" ? "pointer-events-none":"pointer-events-auto"

//       )
//           }
//         >
//       <div className={`relative size-9 rounded-xl flex items-center justify-center transition-all

//           group-[.slide-active]:bg-[#1E3A5F] hover:bg-slate-100
//             `}

//       >
//         <t.Icon size={17} className={'group-[.slide-active]:text-white text-slate-400'} />
//         {/* {  (
//               <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
//                 {pendingJobs.length}
//               </span>
//             )} */}
//       </div >
//       <span className={`text-[10px] font-semibold group-[.slide-active]:text-[#1E3A5F]'text-slate-400`}>
//         {t.label}
//       </span>
//     </CustomNavLink>
//   ))
// }
//     </div >
//   )
// }

const userQuery = {
  queryKey: ["user"],
  queryFn: async () => {
    const { data } = await customFetch.get("/users/current-user");
    return data

  }
}


// guards/workerLoader.ts
export const workerRouteLoader = (queryClient: QueryClient) => async () => {
  let user;
  try {
    ({ user } = await queryClient.ensureQueryData(userQuery));
  } catch {
    return redirect("/auth");
  }
  if (user.role !== "worker") return redirect("/");

  // Warmed here so it's ready the instant the worker app opens — the
  // dashboard's active-job banner and the clock screen both read this same
  // cached query, not just whoever navigates to /worker/clock first.
  // Best-effort: a failure here shouldn't block navigation or log the
  // worker out, it just means the banner shows once its own query lands.
  await queryClient.ensureQueryData(activeWorkerJob()).catch(() => { });

  return null;
};
// ─── Root ──────────────────────────────────────────────────────────────────────
export function WorkerAppLayout() {

  const navigation = useNavigation()
  const location = useLocation();
  const navigate = useNavigate()

  const isRouteChange =
    navigation.state === "loading" &&
    navigation.location &&
    navigation.location.pathname !== location.pathname;

  const { user } = useQuery(userQuery)?.data as unknown as any || { user: null }

  const activeJob = useQuery(activeWorkerJob()).data?.job as
    (CreateJobForm & { workerJobDetails?: { checkedInAt?: string } }) | null | undefined
  const notificationRef = useRef<Notification | null>(null)

  // Best-effort top-up, independent of activeJob: covers shifts accepted
  // before push subscribing existed, and subscriptions that silently
  // dropped (cleared site data, reinstall). ensureNotificationPermission
  // only actually shows the native prompt once per origin (while
  // permission is still "default") — once answered, this is a silent no-op
  // on every future load, granted or denied.
  useEffect(() => {
    ensureNotificationPermission().then(permission => {
      if (permission === "granted") ensurePushSubscription().catch(() => { })
    })
  }, [])

  // Shows a system-level notification with the running elapsed time while a
  // shift is in progress, so a worker still sees it's running without the
  // app open. Only actually prompts for permission once there's a job to
  // tell them about, not proactively on every app load.
  useEffect(() => {
    if (!activeJob) {
      notificationRef.current?.close()
      notificationRef.current = null
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | undefined

    ensureNotificationPermission().then(permission => {
      if (cancelled || permission !== "granted") return

      // Reaches the device even once the app/browser is closed — the
      // foreground ticking notification below only covers the app-open case.
      ensurePushSubscription().catch(() => { })

      const update = () => {
        const checkedInAt = activeJob.workerJobDetails?.checkedInAt
        const elapsedSeconds = checkedInAt ? Math.max(dayjs().diff(dayjs(checkedInAt), "second"), 0) : 0

        notificationRef.current?.close()
        const notification = new Notification("You're on the clock", {
          body: `${activeJob.title} — ${formatSecondsAsDuration(elapsedSeconds)} elapsed`,
          tag: "active-job",
          silent: true,
        })
        notification.onclick = () => {
          window.focus()
          navigate('/worker/clock')
        }
        notificationRef.current = notification
      }

      update()
      intervalId = setInterval(update, 60_000)
    })

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
    // Keyed on the job id only — re-running this on every activeJob object
    // identity change (e.g. a background refetch) would tear down and
    // recreate the notification/interval for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?._id])

  return (
    <div className="border-black   bg-[#F8FAFC]">
      <ScrollToTop />

      <div className="  max-w-md mx-auto ">


        {/* Content area */}
        <div className="px-2 pb-44 ">
          <Outlet
            context={{ user }}
          />
        </div>
        {isRouteChange &&
          <div className='loader'>

          </div>
        }
        {/* Bottom nav */}
        <BottomNav />
      </div>
    </div>
  )
}
