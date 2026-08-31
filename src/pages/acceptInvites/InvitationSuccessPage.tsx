import {
    ArrowRight,
    CheckCircle2,
} from "lucide-react";
import {
    motion,
} from "framer-motion";
import {
    useLocation,
    useNavigate,
} from "react-router";

export default function InvitationSuccessPage() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const state =
        location.state as
            | {
                  company?: string;
                  role?:
                      | "worker"
                      | "manager";
              }
            | undefined;

    const company =
        state?.company ??
        "your company";

    const role =
        state?.role ?? "worker";

    const done = () => {
        navigate(
            role === "worker"
                ? "/worker"
                : "/"
        );
    };

    return (
        <div className="text-center py-4">
            <motion.div
                initial={{
                    scale: 0,
                    opacity: 0,
                }}
                animate={{
                    scale: 1,
                    opacity: 1,
                }}
                transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 20,
                }}
                className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
            >
                <CheckCircle2
                    size={32}
                    className="text-emerald-500"
                    strokeWidth={1.5}
                />
            </motion.div>

            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">
                All set
            </p>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
                You're all set!
            </h2>

            <p className="text-sm text-slate-500 leading-relaxed mb-8">
                You've joined{" "}
                <strong className="text-slate-700">
                    {company}
                </strong>{" "}
                as a{" "}
                {role === "worker"
                    ? "Worker"
                    : "Manager"}
                .
            </p>

            <button
                type="button"
                onClick={done}
                className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] flex items-center justify-center gap-2"
            >
                {role === "worker"
                    ? "Go to my jobs"
                    : "Go to dashboard"}

                <ArrowRight
                    size={14}
                />
            </button>
        </div>
    );
}