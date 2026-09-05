import { RestrictionBanner } from '@/components/restriction/RestrictionBanner'
import BottomNav from '@/components/ui/BottomNav'
import { isRestricted } from '@/data/restrictionMockData'
import { activeWorkerJob } from '@/pages/worker/ClockScreenPage'
import { workerDashboardstats } from '@/pages/worker/WorkerProfilepage'
import customFetch from '@/utils/customFetch'
import { formatSecondsAsDuration } from '@/utils/date'
import { ensureNotificationPermission } from '@/utils/notifications'
import { ensurePushSubscription } from '@/utils/pushSubscription'
import ScrollToTop from '@/utils/scroll-to-top'
import type { CreateJobForm } from '@/utils/types'
import { getMyRestriction } from '@/utils/api-request-functions'
import { QueryClient, useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { Outlet, redirect, useLocation, useNavigate, useNavigation ,} from 'react-router'


const userQuery = {
  queryKey: ["user"],
  queryFn: async () => {
    const { data } = await customFetch.get("/users/current-user");
    return data

  }
}

const myRestrictionQuery = {
  queryKey: ["my-restriction"],
  queryFn: getMyRestriction,
}


// guards/workerLoader.ts
export const workerRouteLoader = (queryClient: QueryClient) => async () => {
  let user;
  try {
    ({ user } = await queryClient.ensureQueryData(userQuery));
    queryClient.ensureQueryData(workerDashboardstats()).catch(() => { });

  } catch {
    return redirect("/auth");
  }
  if (user.role !== "worker") return redirect("/");

  // A fully suspended worker (accessLevel "none") gets bounced to the
  // dedicated suspended screen before anything else in the worker app
  // loads — read_only/limited restrictions let them through, just with
  // the banner below. Best-effort: a failed fetch here shouldn't lock a
  // non-restricted worker out of the app, so it fails open.
  const restriction = await queryClient.ensureQueryData(myRestrictionQuery).catch(() => null);
  if (restriction?.accessLevel === "none") return redirect("/account/suspended");

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

        // Scheduled shift window, same overnight-shift handling as ClockScreenPage.
        const today = dayjs().format("YYYY-MM-DD")
        const scheduledStart = dayjs(`${today} ${activeJob.startTime}`)
        let scheduledEnd = dayjs(`${today} ${activeJob.endTime}`)
        if (scheduledEnd.isBefore(scheduledStart)) scheduledEnd = scheduledEnd.add(1, "day")
        const totalSeconds = Math.max(scheduledEnd.diff(scheduledStart, "second"), 0)

        const percentComplete = totalSeconds > 0
          ? Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100)))
          : 0
        const remainingSeconds = Math.max(totalSeconds - elapsedSeconds, 0)

        notificationRef.current?.close()
        // The Web Notification API has no native progress-bar UI (that's an
        // Android-app-only affordance) — the percentage is shown as text
        // instead, in the title so it's visible even if the body truncates.
        const notification = new Notification(`${percentComplete}% through your shift`, {
          body: `${activeJob.title} — ${formatSecondsAsDuration(remainingSeconds)} remaining`,
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
  const [showRestrictionDetail, setShowRestrictionDetail] = useState(false)
  const restriction = useQuery(myRestrictionQuery).data ?? null
  return (
    <div className="border-black   bg-[#F8FAFC]">
      <ScrollToTop />
         {/* Restriction banner — only read_only/limited ever render here; a
             "none" restriction already redirected to /account/suspended in
             the loader above before this component even mounts. */}
            {isRestricted(restriction) && (
              <RestrictionBanner
                restriction={restriction!}
                onViewDetails={() => setShowRestrictionDetail(true)}
              />
            )}
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
