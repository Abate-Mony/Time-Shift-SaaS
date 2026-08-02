import { Home, Briefcase, Timer, CalendarDays, User } from "lucide-react"
import { motion } from "framer-motion"
// import CustomNavLink from "./CustomNavLink"
import { cn } from "@/lib/utils"
import CustomNavLink from "./link"

type WorkerTab = "/" | "jobs" | "clock" | "schedule" | "profile"

function BottomNav() {
  const tabs: { id: WorkerTab; label: string; Icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: "/", label: "Home", Icon: Home },
    { id: "jobs", label: "Jobs", Icon: Briefcase },
    { id: "clock", label: "Clock", Icon: Timer },
    { id: "schedule", label: "Schedule", Icon: CalendarDays },
    { id: "profile", label: "Profile", Icon: User },
  ]

  return (
    <div className="bg-white border-t max-w-md px-2 rounded-t-lg w-full fixed bottom-0 border-[#E2E8F0] pb-3 grid grid-cols-5 shrink-0 shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.06)]">
      {tabs.map(t => (
        <CustomNavLink
          end={t.id === "/"}
          to={t.id === "/" ? "/worker" : `/worker/${t.id}`}
          key={t.id}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center rounded-t-full h-auto gap-1 py-1.5 px-2 transition-transform duration-300 bg-white",
              isActive && "-translate-y-3",
                t.id === "clock" ? "pointer-events-none" : "pointer-events-auto"
            )
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                className={cn(
                  "relative size-9 rounded-xl flex items-center justify-center",
                  !isActive && "hover:bg-slate-100"
                )}
                animate={{ scale: isActive ? 1 : 1 }}
              >
                {/* Sliding active pill — shared layoutId morphs smoothly between tabs */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActivePill"
                    className="absolute inset-0 rounded-xl bg-[#1E3A5F] shadow-lg shadow-[#1E3A5F]/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="relative z-10"
                >
                  <t.Icon size={17} className={isActive ? "text-white" : "text-slate-400"} />
                </motion.div>
              </motion.div>

              <motion.span
                animate={{ color: isActive ? "#1E3A5F" : "#94A3B8" }}
                transition={{ duration: 0.25 }}
                className="text-[10px] font-semibold"
              >
                {t.label}
              </motion.span>
            </>
          )}
        </CustomNavLink>
      ))}
    </div>
  )
}

export default BottomNav