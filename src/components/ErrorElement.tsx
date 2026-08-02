import type { CreateJobForm, User } from "@/utils/types"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { isRouteErrorResponse, Link, useOutletContext, useRouteError } from "react-router"
import { AnimatedText } from "./ui/AnimatedError"

function getErrorInfo(error: unknown): { status?: number; message: string } {
    if (isRouteErrorResponse(error)) {
        const message =
            typeof error.data === "string"
                ? error.data
                : error.data?.message || error.statusText || "Something went wrong."
        return { status: error.status, message }
    }

    if (error instanceof AxiosError) {
        const message =
            error.response?.data?.msg ||
            error.response?.data?.message ||
            (typeof error.response?.data === "string" ? error.response.data : undefined) ||
            error.message ||
            "Something went wrong."
        return { status: error.response?.status, message }
    }

    if (error instanceof Error) {
        return { message: error.message || "Something went wrong." }
    }

    return { message: "Something went wrong." }
}

const ErrorElement = () => {
    const error = useRouteError()
    console.error(error)

    const { status, message } = getErrorInfo(error)
    const { user } = useOutletContext() as {
        user: User
    } || { user: null };

    const path = user?.role === "worker" ? "/worker" : "/"
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
            {/* const user=usecont */}

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-xl shadow-slate-200/60 p-8 flex flex-col items-center text-center">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 16, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5"
                    >
                        <AlertTriangle size={28} className="text-red-500" />
                    </motion.div>

                    {/* Status code, if available */}
                    {status && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2"
                        >
                            Error {status}
                        </motion.p>
                    )}

                    {/* Animated headline */}
                    <div className="mb-2">
                        <AnimatedText
                            className="text-2xl sm:text-3xl leading-tight"
                            text="Something went wrong"
                        />
                    </div>

                    {/* Actual error detail */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-sm text-slate-500 leading-relaxed mb-7 max-w-xs"
                    >
                        {message}
                    </motion.p>

                    {/* Actions */}
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.reload()}
                            className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                            <RotateCcw size={15} />
                            Try again
                        </motion.button>

                        <Link to={path} className="flex-1">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#1E3A5F]/20 hover:bg-[#162D4A] transition-colors"
                            >
                                <Home size={15} />
                                Go home
                            </motion.div>
                        </Link>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    If this keeps happening, contact support and share what you were doing.
                </p>
            </motion.div>
        </div>
    )
}

export default ErrorElement