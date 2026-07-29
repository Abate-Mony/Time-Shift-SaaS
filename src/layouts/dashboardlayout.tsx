import { useState } from 'react'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'
import { WorkerApp } from '../pages/WorkerApp'
import { Outlet, redirect, useLocation, useNavigation, type LoaderFunctionArgs } from 'react-router'
import { useMediaQuery } from "react-responsive";
import customFetch from '@/utils/customFetch'
import { useQuery, type QueryClient } from '@tanstack/react-query'
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

export const loader = (queryClient: QueryClient) => async ({ request: _request }: LoaderFunctionArgs) => {
    try {
        return await queryClient.ensureQueryData(userQuery)
    } catch (error) {
        // toast.error("fail to login you in try again later")
        return redirect(`/auth`)
    }
}
const userQuery = {
    queryKey: ["user"],
    queryFn: async () => {
        const { data } = await customFetch.get("/users/current-user");
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
    const { user } = useQuery(userQuery)?.data as unknown as any || { user: null }
    return (
        <div className="flex h-screen  overflow-hidden bg-[#F8FAFC]">
            <Sidebar active={page} collapsed={sidebarCollapsed} />

            <div
                className="flex-1 flex flex-col min-w-0 transition-all duration-200"
                style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
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
    )
}

// function HelpPage() {
//     const articles = [
//         { section: 'Getting Started', items: ['Creating your first job', 'Inviting workers to your team', 'Setting up locations', 'Understanding the dashboard'] },
//         { section: 'Jobs & Assignments', items: ['How to assign workers to a job', 'Job statuses explained', 'Editing and cancelling jobs', 'Recurring job templates'] },
//         { section: 'Time Tracking', items: ['How workers clock in and out', 'Break tracking', 'Editing time records', 'GPS verification'] },
//         { section: 'Reports & Payroll', items: ['Generating weekly timesheets', 'Exporting payroll to CSV/PDF', 'Worker performance reports', 'Overtime calculations'] },
//     ]
//     return (
//         <div className="p-6 max-w-3xl animate-fade-in">
//             <div className="mb-7">
//                 <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Help Centre</h1>
//                 <p className="text-sm text-slate-500 mt-0.5">Find answers and learn how to use work.wrk</p>
//             </div>

//             <div className="relative mb-6">
//                 <input
//                     placeholder="Search help articles..."
//                     className="w-full h-11 pl-5 pr-5 border border-[#E2E8F0] rounded-xl text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all shadow-sm"
//                 />
//             </div>

//             <div className="grid grid-cols-2 gap-5">
//                 {articles.map(section => (
//                     <div key={section.section} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
//                         <h3 className="text-sm font-semibold text-slate-800 mb-3">{section.section}</h3>
//                         <div className="flex flex-col gap-1.5">
//                             {section.items.map(item => (
//                                 <button key={item} className="text-left text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors py-0.5">
//                                     {item}
//                                 </button>
//                             ))}
//                         </div>
//                     </div>
//                 ))}
//             </div>

//             <div className="mt-5 bg-[#0F172A] rounded-2xl p-6 flex items-center justify-between">
//                 <div>
//                     <p className="text-sm font-semibold text-white mb-1">Still need help?</p>
//                     <p className="text-xs text-white/50">Our support team typically responds within 2 hours.</p>
//                 </div>
//                 <button className="h-10 px-5 bg-white text-[#0F172A] text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors shrink-0">
//                     Contact Support
//                 </button>
//             </div>
//         </div>
//     )
// }
