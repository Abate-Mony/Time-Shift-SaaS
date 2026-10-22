import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, Users } from "lucide-react"

import { getMyTeam } from "@/utils/api-request-functions"
import { Avatar } from "@/components/ui"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeamMate } from "@/utils/types"

const ROLE_LABEL: Record<TeamMate["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  worker: "Worker",
}

const ROLE_ORDER: TeamMate["role"][] = ["owner", "admin", "manager", "worker"]

const teamQuery = {
  queryKey: ["my-team"],
  queryFn: getMyTeam,
}

export const loader = async () => null

export default function TeamDirectoryScreen() {
  const navigate = useNavigate()
  const { data: teammates = [], isLoading } = useQuery(teamQuery)

  // Grouped by role so the one owner/admin doesn't get buried in a long
  // alphabetical worker list.
  const groups = ROLE_ORDER
    .map(role => ({ role, members: teammates.filter(m => m.role === role) }))
    .filter(g => g.members.length > 0)

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <Users size={15} className="text-muted-foreground" />
          </span>
          Team Directory
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Everyone at your company.</p>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="w-9 h-9 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          ))}
        </div>
      ) : teammates.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No other teammates yet.</p>
      ) : (
        groups.map(group => (
          <div key={group.role} className="flex flex-col gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {ROLE_LABEL[group.role]}{group.members.length > 1 ? "s" : ""}
            </p>
            <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm divide-y divide-border">
              {group.members.map(m => (
                <div key={m._id} className="flex items-center gap-3 px-4 py-3.5">
                  <Avatar initials={m.fullname.slice(0, 2).toUpperCase()} src={m.photoUrl} size="md" index={0} />
                  <p className="text-sm font-semibold text-foreground truncate">{m.fullname}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
