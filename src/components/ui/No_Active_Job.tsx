import { Link } from "react-router"
import { motion } from "framer-motion"
import { Clock, Calendar, ArrowRight, Briefcase } from "lucide-react"

export function NoActiveShift({
  nextShift,
}: {
  nextShift?: {
    _id: string
    title: string
    date: string
    startTime: string
    location: string
  } | null
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 pb-4"
    >
      {/* Idle clock card — same shape as the running timer so the swap feels continuous */}
      <div className="rounded-3xl bg-[#0F172A] p-8 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center mx-auto mb-5"
          >
            <Clock size={26} className="text-white/40" />
          </motion.div>

          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
            Not clocked in
          </p>

          <p
            className="text-5xl font-bold text-white/15 tracking-tighter mb-1"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            00:00:00
          </p>

          <p className="text-xs text-white/20 font-medium">
            Your timer starts when you begin a shift
          </p>
        </div>
      </div>

      {/* Next shift, if there is one */}
      {nextShift ? (
        <Link
          to={`/worker/jobs/${nextShift._id}`}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm hover:border-slate-300 transition-colors block"
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} className="text-[#1E3A5F]" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Up next
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-900 mb-1">{nextShift.title}</p>
          <p className="text-xs text-slate-500 mb-3">
            {nextShift.date} · {nextShift.startTime} · {nextShift.location}
          </p>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
            View shift <ArrowRight size={13} />
          </span>
        </Link>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 text-center shadow-sm">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3">
            <Briefcase size={18} className="text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">No upcoming shifts</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-[220px] mx-auto">
            When your manager assigns you a job, it'll appear here ready to start.
          </p>
        </div>
      )}

      <Link
        to="/worker/jobs"
        className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
      >
        <Briefcase size={15} className="text-slate-400" />
        Browse my jobs
      </Link>
    </motion.div>
  )
}