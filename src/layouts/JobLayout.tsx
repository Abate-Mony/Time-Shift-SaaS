import { Button } from "@/components/ui/button"
import CustomNavLink from "@/components/ui/link"
import { Scrollable } from "@/components/ui/scrollable"
import { Separator } from "@/components/ui/separator"
import { Plus } from "lucide-react"
import { Outlet } from "react-router"

const JobLayout = () => {
    return (
        <div className="p-6">
           {/* Header */}
               <div className="flex items-start justify-between mb-6">
                 <div>
                   <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Jobs</h1>
                   <p className="text-sm text-slate-500 mt-0.5">Manage and monitor all work assignments</p>
                 </div>
                 <Button >
                   <Plus size={14} /> New Job
                 </Button>
               </div>
         
            <Scrollable className="space-x-1.5" >
                <CustomNavLink show end
                    animateClassName='bg-black/40 p-0 rounded-sm'
                    layoutId="job-layout-links" className="w-fit" to={"/jobs"}>
                    All Jobs
                </CustomNavLink>
                <CustomNavLink 
                    animateClassName='bg-black/40 p-0 rounded-sm'
                    show layoutId="job-layout-links" className="w-fit" to={"/jobs/recurring"}>
                    Recurring Jobs
                </CustomNavLink>
            </Scrollable>
            <Separator className="h-px bg-black/5" />
            <Outlet />
        </div>
    )
}

export default JobLayout