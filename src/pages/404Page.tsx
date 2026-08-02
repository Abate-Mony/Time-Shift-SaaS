import { Link, useNavigate, useOutletContext } from "react-router"
import { motion } from "framer-motion"
import { Home, ArrowRight, ArrowLeft, SearchX } from "lucide-react"
import type { User } from "@/utils/types"

const NotFound = () => {
    const { user } = (useOutletContext() as { user: User }) || { user: null }
    const navigate = useNavigate()

    const homePath = user?.role === "worker" ? "/worker" : "/"
    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1)
        } else {
            navigate(homePath)
        }
    }
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xl shadow-slate-200/60 p-8 flex flex-col items-center text-center overflow-hidden">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
                        className="relative w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-2"
                    >
                        <SearchX size={32} className="text-blue-500" />
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className="absolute w-1.5 h-1.5 rounded-full bg-blue-300"
                                style={{ top: 6 + i * 8, right: -6 - i * 4 }}
                                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.3 }}
                            />
                        ))}
                    </motion.div>

                    {/* 404 headline */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="mb-1"
                    >
                        <span className="text-6xl font-black tracking-tight text-[#1E3A5F]">404</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="text-xl font-bold text-slate-900 mb-2"
                    >
                        Page not found
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                        className="text-sm text-slate-500 leading-relaxed mb-7 max-w-xs"
                    >
                        The page you're looking for doesn't exist or may have been moved.
                    </motion.p>

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.4 }}
                        className="w-full flex flex-col sm:flex-row gap-3"
                    >
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBack}
                            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft size={15} />
                            Go back
                        </motion.button>

                        <Link to={homePath} className="flex-1">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors"
                            >
                                <Home size={15} />
                                {user ? "Dashboard" : "Login"}
                                <ArrowRight size={15} />
                            </motion.div>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}

export default NotFound