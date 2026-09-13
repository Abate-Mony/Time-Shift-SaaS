import CustomNavLink from '@/components/ui/link'
import { Outlet } from 'react-router'

const WorkerJobLayout = () => {
    const Navs = [
        {
            label: "My Jobs",
            to: "/worker/jobs/my-jobs"
        },
        {
            label: "Open Shifts",
            to: "/worker/jobs/open-shifts"
        },
        {
            label: "Recurring Jobs",
            to: "/worker/jobs/recurring-jobs"
        },
    ]
    return (
        <div>

            {/* View toggle */}
            <div className="flex gap-1 mt-2 bg-muted p-1 rounded-xl">
                {
                    Navs.map((nav) => (<CustomNavLink layoutId='wokerjoblayout' 
                        end
                        animateClassName='bg-card text-foreground shadow-sm size-full' show to={nav.to}

                        className={`flex-1 h-auto py-2 text-center rounded-lg text-xs font-semibold transition-all  'text-muted-foreground hover:text-foreground'}`}
                    >
                        {nav.label}
                    </CustomNavLink>))
                }

            </div>
            <Outlet />
        </div>
    )
}

export default WorkerJobLayout