import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Clock,
} from "lucide-react";

type StateType =
    | "expired"
    | "revoked"
    | "already-accepted"
    | "invalid";

interface Props {
    type: StateType;
    company?: string;
    onSignIn: () => void;
}

const configs = {
    expired: {
        icon: Clock,
        iconWrapper: "bg-amber-50",
        iconColor: "text-amber-500",

        title: "Invitation expired",

        description:
            "This invitation is no longer valid.",

        action: "Back to sign in",
    },

    revoked: {
        icon: Ban,
        iconWrapper: "bg-red-50",
        iconColor: "text-red-500",

        title:
            "Invitation no longer available",

        description:
            "This invitation has been cancelled.",

        action: "Back to sign in",
    },

    "already-accepted": {
        icon: CheckCircle2,
        iconWrapper: "bg-emerald-50",
        iconColor: "text-emerald-500",

        title:
            "Invitation already accepted",

        description:
            "This invitation has already been used.",

        action: "Sign in",
    },

    invalid: {
        icon: AlertTriangle,
        iconWrapper: "bg-slate-100",
        iconColor: "text-slate-400",

        title: "Invitation not found",

        description:
            "This invitation link may be invalid or no longer available.",

        action: "Go to sign in",
    },
};

export default function InvitationState({
    type,
    company,
    onSignIn,
}: Props) {
    const config = configs[type];
    const Icon = config.icon;

    return (
        <div className="text-center py-4">
            <div
                className={`
                    w-12 h-12
                    rounded-full
                    flex items-center
                    justify-center
                    mx-auto mb-5
                    ${config.iconWrapper}
                `}
            >
                <Icon
                    size={22}
                    className={
                        config.iconColor
                    }
                />
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-2">
                {config.title}
            </h2>

            <p className="text-sm text-slate-500 leading-relaxed mb-2">
                {config.description}
            </p>

            {type === "expired" &&
                company && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-8">
                        Ask a manager at{" "}
                        <strong className="text-slate-700">
                            {company}
                        </strong>{" "}
                        to send you a new
                        invitation.
                    </p>
                )}

            {type === "revoked" &&
                company && (
                    <p className="text-sm text-slate-500 leading-relaxed mb-8">
                        Contact your manager at{" "}
                        <strong className="text-slate-700">
                            {company}
                        </strong>{" "}
                        if you believe this
                        is a mistake.
                    </p>
                )}

            <button
                type="button"
                onClick={onSignIn}
                className="
                    w-full h-11
                    border border-slate-200
                    text-sm font-semibold
                    text-slate-700
                    rounded-xl
                    hover:bg-slate-50
                    transition-colors
                "
            >
                {config.action}
            </button>
        </div>
    );
}