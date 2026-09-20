import { EmptyState } from "@/components/empty-state"
import OpenShiftCard from "@/components/OpenShiftCard"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import { AlertCircle, CalendarClock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

function OpenShiftCardSkeleton() {
    return (
        <div className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
            <div className="h-1 bg-muted" />
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className={`h-3 ${i === 0 || i === 3 ? 'col-span-2 w-3/4' : 'w-2/3'}`} />
                    ))}
                </div>
            </div>
        </div>
    )
}

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
                <h2 className="text-lg font-bold text-foreground">Open Shifts</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Unassigned shifts you can pick up</p>
            </div>

            {isPending ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <OpenShiftCardSkeleton key={i} />
                    ))}
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
