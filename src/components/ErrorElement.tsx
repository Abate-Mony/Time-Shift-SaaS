import type { CreateJobForm, User } from "@/utils/types"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { isRouteErrorResponse, Link, useOutletContext, useRouteError } from "react-router"
import { AnimatedText } from "./ui/AnimatedError"
import { STALE_CHUNK_RELOAD_GUARD_KEY } from "@/utils/staleChunkGuard"

// A lazy route chunk (Reports/Analytics, see routes.tsx's `lazy:` fields)
// fetches its own hashed JS file on demand. If a tab has been open since
// before a deploy, that hash no longer exists on the server once the next
// deploy replaces it — the dynamic import 404s with one of these
// browser-specific messages. A hard reload fixes it (the browser fetches
// the current index.html, which points at the current hashes) — no need to
// show the generic error screen and make the user click "Try again"
// themselves. Guarded by sessionStorage so a *genuinely* broken deploy
// doesn't reload-loop forever.
const STALE_CHUNK_PATTERN = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i

function isStaleChunkError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : typeof error === "string" ? error : ""
    return STALE_CHUNK_PATTERN.test(message)
}

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

    const staleChunk = isStaleChunkError(error)
    const [reloading] = useState(() => {
        if (!staleChunk) return false
        try {
            return !sessionStorage.getItem(STALE_CHUNK_RELOAD_GUARD_KEY)
        } catch {
            return false
        }
    })

    useEffect(() => {
        if (!reloading) return
        try {
            sessionStorage.setItem(STALE_CHUNK_RELOAD_GUARD_KEY, "1")
        } catch {
            // ignore — worst case this reload isn't guarded against looping
        }
        window.location.reload()
    }, [reloading])

    const { status, message } = getErrorInfo(error)
    const { user } = useOutletContext() as {
        user: User
    } || { user: null };

    const path = user?.role === "worker" ? "/worker" : "/"

    if (reloading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <div className="flex flex-col items-center gap-3 text-center">
                    <RotateCcw size={20} className="text-muted-foreground animate-spin" />
                    <p className="text-sm text-muted-foreground">A new version is available — updating…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            {/* const user=usecont */}

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-card border border-[var(--border)] rounded-3xl shadow-xl shadow-slate-200/60 p-8 flex flex-col items-center text-center">
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
                            className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2"
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
                        className="text-sm text-muted-foreground leading-relaxed mb-7 max-w-xs"
                    >
                        {message}
                    </motion.p>

                    {/* Actions */}
                    <div className="w-full flex flex-col sm:flex-row gap-3">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.reload()}
                            className="flex-1 h-11 rounded-xl border border-[var(--border)] text-sm font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                        >
                            <RotateCcw size={15} />
                            Try again
                        </motion.button>

                        <Link to={path} className="flex-1">
                            <motion.div
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                className="h-11 rounded-xl bg-[var(--primary)] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary)]/20 hover:bg-primary/90 transition-colors"
                            >
                                <Home size={15} />
                                Go home
                            </motion.div>
                        </Link>
                    </div>
                </div>

                {/* Footer hint */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    If this keeps happening, contact support and share what you were doing.
                </p>
            </motion.div>
        </div>
    )
}

export default ErrorElement