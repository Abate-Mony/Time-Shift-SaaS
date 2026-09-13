import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Clock,
} from "lucide-react";

import {
    useNavigate,
    useOutletContext,
    useParams,
} from "react-router";

import type {
    InvitationOutletContext,
} from "../../utils/types/invitation";

const statusConfig = {
    expired: {
        icon: Clock,

        iconWrapper:
            "bg-amber-50",

        iconColor:
            "text-amber-500",

        title:
            "Invitation expired",

        description:
            "This invitation is no longer valid.",

        button:
            "Back to sign in",
    },

    revoked: {
        icon: Ban,

        iconWrapper:
            "bg-red-50",

        iconColor:
            "text-red-500",

        title:
            "Invitation no longer available",

        description:
            "This invitation has been cancelled.",

        button:
            "Back to sign in",
    },

    "already-accepted": {
        icon: CheckCircle2,

        iconWrapper:
            "bg-emerald-50",

        iconColor:
            "text-emerald-500",

        title:
            "Invitation already accepted",

        description:
            "This invitation has already been used.",

        button: "Sign in",
    },

    invalid: {
        icon: AlertTriangle,

        iconWrapper:
            "bg-muted",

        iconColor:
            "text-muted-foreground",

        title:
            "Invitation not found",

        description:
            "This invitation link may be invalid or no longer available.",

        button:
            "Go to sign in",
    },
};

export default function InvitationStatusPage() {
    const navigate =
        useNavigate();

    const { status } =
        useParams();

    const { invite } =
        useOutletContext<InvitationOutletContext>();

    const config =
        statusConfig[
            status as keyof typeof statusConfig
        ] ??
        statusConfig.invalid;

    const Icon = config.icon;

    return (
        <div className="text-center py-4">
            <div
                className={`
                    w-12 h-12
                    rounded-full
                    flex
                    items-center
                    justify-center
                    mx-auto
                    mb-5
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

            <h2 className="text-lg font-bold text-foreground mb-2">
                {config.title}
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
                {
                    config.description
                }
            </p>

            {status ===
                "expired" &&
                invite && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        Ask a manager at{" "}
                        <strong className="text-foreground">
                            {
                                invite
                                    .company
                                    .name
                            }
                        </strong>{" "}
                        to send you a new
                        invitation.
                    </p>
                )}

            {status ===
                "revoked" &&
                invite && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        Contact your
                        manager at{" "}
                        <strong className="text-foreground">
                            {
                                invite
                                    .company
                                    .name
                            }
                        </strong>{" "}
                        if you believe this
                        is a mistake.
                    </p>
                )}

            <button
                type="button"
                onClick={() =>
                    navigate("/auth")
                }
                className="w-full h-11 mt-8 border border-border text-sm font-semibold text-foreground rounded-xl hover:bg-muted transition-colors"
            >
                {config.button}
            </button>
        </div>
    );
}