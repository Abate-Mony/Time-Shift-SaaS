import { RecurringAssignmentCard } from "@/components/RecurringAssignmentCard"
import customFetch from "@/utils/customFetch"
import { describeRecurrence, type Frequency } from "@/utils/recurring"
import type { WorkerRecurringGroup } from "@/utils/types"
import { useQuery, type QueryClient } from "@tanstack/react-query"
import { Repeat2 } from "lucide-react"

interface RawRecurringGroup {
  recurringJobId: string
  title: string
  location?: string
  client?: string
  frequency: Frequency
  interval: number
  daysOfWeek?: number[]
  startTime: string
  endTime: string
  pendingCount: number
  acceptedCount: number
  declinedCount: number
  upcomingCount: number
  nextShift: { jobId: string; assignmentId: string; date: string; startTime: string; endTime: string } | null
  shifts: WorkerRecurringGroup['shifts']
}

const recurringGroupsQuery = () => ({
  queryKey: ['worker-recurring-groups'],
  queryFn: async (): Promise<WorkerRecurringGroup[]> => {
    const { data } = await customFetch.get<{ groups: RawRecurringGroup[] }>('/workers/recurring-groups')
    return data.groups.map(g => ({
      recurringJobId: g.recurringJobId,
      title: g.title,
      location: g.location,
      client: g.client,
      recurrenceLabel: describeRecurrence(g),
      startTime: g.startTime,
      endTime: g.endTime,
      pendingCount: g.pendingCount,
      acceptedCount: g.acceptedCount,
      declinedCount: g.declinedCount,
      upcomingCount: g.upcomingCount,
      nextShift: g.nextShift ?? undefined,
      shifts: g.shifts,
    }))
  },
})

export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(recurringGroupsQuery())
  return null
}

export default function RecurringAssignmentPage() {
  const groups = useQuery(recurringGroupsQuery()).data as WorkerRecurringGroup[]

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#1E3A5F]/8 flex items-center justify-center mb-4">
          <Repeat2 size={22} className="text-[#1E3A5F]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1.5">No recurring shifts</h3>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
          Recurring shifts you're assigned to will show up here so you can respond to them in bulk.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {groups.map(group => (
        <RecurringAssignmentCard key={group.recurringJobId} group={group} />
      ))}
    </div>
  )
}
