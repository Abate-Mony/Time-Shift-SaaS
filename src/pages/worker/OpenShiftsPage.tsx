import { EmptyState } from "@/components/empty-state"
import OpenShiftCard from "@/components/OpenShiftCard"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarClock, Loader2 } from "lucide-react"

export const openShiftsQuery = {
    queryKey: ["open-shifts"],
    queryFn: async () => {
        const { data } = await customFetch.get<{ jobs: CreateJobForm[] }>("/workers/open-shifts")
        return data
    },
}

export const loader = (queryClient: QueryClient) => async () => {
    await queryClient.ensureQueryData(openShiftsQuery)
    return null
}

export default function OpenShiftsPage() {
    const { data, isPending, isError } = useQuery(openShiftsQuery)
    const shifts = data?.jobs ?? []

    return (
        <div className="flex flex-col gap-4 pb-4">
            <div>
                <h2 className="text-lg font-bold text-slate-900">Open Shifts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Unassigned shifts you can pick up</p>
            </div>

            {isPending ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
            ) : isError ? (
                <EmptyState
                    icon={<AlertCircle size={20} />}
                    title="Couldn't load open shifts"
                    description="Something went wrong. Pull to refresh or try again shortly."
                />
            ) : shifts.length === 0 ? (
                <EmptyState
                    icon={<CalendarClock size={20} />}
                    title="No open shifts right now"
                    description="When a manager opens a shift up for claiming, it'll show up here."
                />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shifts.map(shift => (
                        <OpenShiftCard shift={shift} key={shift._id} />
                    ))}
                </div>
            )}
        </div>
    )
}
