import { useNavigate } from "react-router"
import { Banknote, Building2, ChevronLeft, ChevronRight, FolderLock, LayoutGrid, MessageCircle, Users, type LucideIcon } from "lucide-react"

type HubItem = {
  label: string
  sub: string
  icon: LucideIcon
  color: string
  bg: string
  to: string
}

const HUB_ITEMS: HubItem[] = [
  { label: "Messages & Support", sub: "Reach your managers", icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50", to: "/worker/profile/contact-manager" },
  { label: "Documents & Credentials", sub: "IDs, certificates, policies", icon: FolderLock, color: "text-violet-600", bg: "bg-violet-50", to: "/worker/profile/documents" },
  { label: "Payslips", sub: "Pay history and totals", icon: Banknote, color: "text-teal-600", bg: "bg-teal-50", to: "/worker/profile/earnings" },
  { label: "Team Directory", sub: "Managers and colleagues", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50", to: "/worker/profile/team" },
  { label: "Work Locations", sub: "Sites you've worked", icon: Building2, color: "text-sky-600", bg: "bg-sky-50", to: "/worker/profile/locations" },
]

export const loader = async () => null

export default function WorkHubScreen() {
  const navigate = useNavigate()

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
            <LayoutGrid size={15} className="text-muted-foreground" />
          </span>
          Work Hub
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Everything you need beyond your shifts.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {HUB_ITEMS.map(item => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.to)}
            className="bg-card rounded-2xl border border-[var(--border)] p-4 text-left shadow-sm hover:border-slate-300 transition-colors min-h-32 flex flex-col justify-between"
          >
            <span className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
              <item.icon size={17} className={item.color} />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground mt-4 leading-snug">{item.label}</p>
              <div className="flex items-center justify-between gap-1 mt-1">
                <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                <ChevronRight size={13} className="text-slate-300 shrink-0" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
