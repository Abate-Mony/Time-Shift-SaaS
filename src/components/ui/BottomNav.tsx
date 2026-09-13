import { Home, Briefcase, Timer, CalendarDays, User, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
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
    <div className="bg-card border-t max-w-md px-2 rounded-t-lg w-full fixed bottom-0 border-border pb-3 grid grid-cols-5 shrink-0 shadow-[0_-4px_16px_-4px_rgba(15,23,42,0.06)] dark:shadow-none">
      {tabs.map(t => (
        <CustomNavLink
        showPendingBar
          end={t.id === "/"}
          to={t.id === "/" ? "/worker" : `/worker/${t.id}`}
          key={t.id}
          className={({ isActive, isPending }) =>
            cn(
              "flex flex-col justify-center items-center rounded-t-full h-auto gap-1 py-1.5 px-2 transition-transform duration-300 bg-card",
              isActive && "-translate-y-3",
              isPending && "cursor-wait",
              // t.id === "clock" ? "pointer-events-none" : "pointer-events-auto"
            )
          }
        >
            {({ isActive, isPending }) => (
        <div className=" flex flex-col items-center justify-center">
            <>
              <motion.div
                className={cn(
                  "relative size-9 rounded-xl flex items-center justify-center",
                  !isActive && !isPending && "hover:bg-muted"
                )}
              >
                {/* Sliding active pill — shared layoutId morphs between tabs */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActivePill"
                    className="absolute inset-0 rounded-xl bg-primary shadow-lg shadow-primary/25 z-0 "
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}

                {/* Pending ring — sits behind the icon while the loader runs */}
                {isPending && !isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-xl bg-muted z-0"
                  />
                )}

                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="relative z-10 "
                >
                  {isPending ? (
                    <Loader2
                      size={17}
                      className={cn(
                        "animate-spin",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                  ) : (
                    <t.Icon size={17} className={isActive ? "text-primary-foreground" : "text-muted-foreground"} />
                  )}
                </motion.div>
              </motion.div>

              {/* Plain classes + CSS transition instead of framer's `animate={{color}}` —
                  motion can't interpolate CSS custom properties (bg-primary/text-primary
                  resolve through var()), so an explicit hex pair would silently stop
                  tracking the theme. transition-colors gets the same fade with zero JS. */}
              <span
                className={cn(
                  "text-[10px] font-semibold text-center! transition-colors duration-250",
                  isActive ? "text-primary" : "text-muted-foreground",
                  isPending && "opacity-60"
                )}
              >
                {t.label}
              </span>
            </>
        </div>
          )}
        </CustomNavLink>
      ))}
    </div>
  )
}

export default BottomNav