import { useEffect, useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { WorkerApp } from '../pages/WorkerApp'
import { Outlet, redirect, useLocation, useNavigation, type LoaderFunctionArgs } from 'react-router'
import { useMediaQuery } from "react-responsive";
import customFetch from '@/utils/customFetch'
import { useQuery, type InfiniteQueryObserverBaseResult, type QueryClient } from '@tanstack/react-query'
import ScrollToTop from '@/utils/scroll-to-top'
import type { FileRef, User } from '@/utils/types'
import { ensureNotificationPermission } from '@/utils/notifications'
import { ensurePushSubscription } from '@/utils/pushSubscription'
export interface iUser extends User {
    company: {
        plan: string,
        maxWorkers: number,
        // _id: new ObjectId("6a7b7786200c0f868437aadd"),
        name: string,
        logo?: FileRef | null,
    },
}
type Page =
    | 'dashboard'
    | 'jobs'
    | 'create-job'
    | 'workers'
    | 'calendar'
    | 'sites'
    | 'messages'
    | 'reports'
    | 'timesheets'
    | 'analytics'
    | 'billing'
    | 'notifications'
    | 'settings'
    | 'help'
    | 'worker-app'

export const loader = (queryClient: QueryClient) => async ({ request: _request }: LoaderFunctionArgs) => {
    try {
        const { user } = await queryClient.ensureQueryData(userQuery);
        // alert(user.role)
        console.log("user role :", user.role)
        if (user.role == "worker") {
            return redirect("/worker")
        }
        // A dedicated platform-admin account (created via
        // createPlatformAdmin.ts) has no company — this layout and its
        // Sidebar assume every user belongs to one (e.g. user.company.name),
        // so there's nothing valid to render here for it. Send it straight
        // to the console it actually has access to instead of crashing.
        if (!user.company && user.platformRole) {
            return redirect("/platform")
        }
        return
    } catch (error) {
        // toast.error("fail to login you in try again later")
        return redirect(`/auth`)
    }
}
export const userQuery = {
    queryKey: ["user"],
    queryFn: async () => {
        const { data } = await customFetch.get<{ user: iUser }>("/users/current-user");
        return data

    }
}
export default function DashboardLayout() {
    const navigation = useNavigation()
    const location = useLocation();

    const isRouteChange =
        navigation.state === "loading" &&
        navigation.location &&
        navigation.location.pathname !== location.pathname;
    const [page, setPage] = useState<Page>('dashboard')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

    const navigate = (id: string) => setPage(id as Page)

    const sidebarWidth = sidebarCollapsed ? 64 : 240

    // Pages that don't use the normal layout (full-bleed)
    const isFullBleed = page === 'messages'
    const isDesktop = useMediaQuery({
        query: "(min-width: 1024px)",
    });
    const { data } = useQuery(userQuery)
    const user = data?.user as iUser

    // Best-effort top-up, same as the worker app: covers accounts that
    // never subscribed (this admin/manager side never asked before), and
    // subscriptions that silently dropped (cleared site data, reinstall).
    // ensureNotificationPermission only actually shows the native prompt
    // once per origin — a silent no-op on every load after that, granted or
    // denied — so this is safe to run unconditionally on mount.
    useEffect(() => {
        ensureNotificationPermission().then(permission => {
            if (permission === "granted") ensurePushSubscription().catch(() => { })
        })
    }, [])

    return (
        <>
            <ScrollToTop />
            <div className="flex h-screen  overflow-hidden bg-muted dark:bg-background">

                <Sidebar active={page} collapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(c => !c)} user={user} />

                <div
                    className="flex-1 flex flex-col min-w-0 transition-all duration-200"
                    style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
                >


                    {page === 'worker-app' ? (
                        <div className="flex-1 overflow-y-auto">
                            <WorkerApp />
                        </div>
                    ) : (
                        <>
                            <TopBar
                                user={user}
                                onToggleSidebar={() => setSidebarCollapsed(c => !c)}
                                onNavigate={navigate}
                            />
                            <main className={`flex-1 overflow-y-auto  ${isFullBleed ? '' : ''}`}>
                                {
                                    <Outlet context={{ user }} />
                                }
                                {isRouteChange &&
                                    <div className='loader'>

                                    </div>
                                }
                            </main>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
