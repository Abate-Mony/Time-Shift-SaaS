import customFetch from "@/utils/customFetch";
import {
    isAxiosError,
} from "axios";
import {
    Eye,
    EyeOff,
} from "lucide-react";
import {
    useState,
} from "react";
import {
    Navigate,
    useNavigate,
    useOutletContext,
} from "react-router";
import toast from "react-hot-toast";

import type {
    InvitationOutletContext,
} from "../../utils/types/invitation";

export default function NewUserInvitePage() {
    const navigate =
        useNavigate();

    const {
        token,
        invite,
        isLoading,
    } =
        useOutletContext<InvitationOutletContext>();

    const [fullname, setFullname] =
        useState(
            invite?.fullname ?? ""
        );

    const [password, setPassword] =
        useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        passwordVisible,
        setPasswordVisible,
    ] = useState(false);

    const [
        confirmVisible,
        setConfirmVisible,
    ] = useState(false);

    const [loading, setLoading] =
        useState(false);

    const [errors, setErrors] =
        useState<
            Record<string, string>
        >({});

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
                <div className="h-11 bg-slate-200 rounded-xl" />
            </div>
        );
    }

    if (!invite) {
        return (
            <Navigate
                replace
                to={`/invite/status/invalid?token=${encodeURIComponent(
                    token
                )}`}
            />
        );
    }

    if (
        invite.accountExists
    ) {
        return (
            <Navigate
                replace
                to={`/invite/existing-user?token=${encodeURIComponent(
                    token
                )}`}
            />
        );
    }

    const validate = () => {
        const nextErrors: Record<
            string,
            string
        > = {};

        if (!fullname.trim()) {
            nextErrors.fullname =
                "Enter your full name.";
        }

        if (
            password.length < 8
        ) {
            nextErrors.password =
                "Password must be at least 8 characters.";
        }

        if (
            password !==
            confirmPassword
        ) {
            nextErrors.confirmPassword =
                "Passwords do not match.";
        }

        setErrors(nextErrors);

        return (
            Object.keys(nextErrors)
                .length === 0
        );
    };

    const handleSubmit =
        async () => {
            if (!validate()) {
                return;
            }

            setLoading(true);

            try {
                await customFetch.post(
                    "/invitations/accept",
                    {
                        token,
                        fullname:
                            fullname.trim(),
                        password,
                    }
                );

                navigate(
                    `/invite/success?token=${encodeURIComponent(
                        token
                    )}`,
                    {
                        replace: true,

                        state: {
                            company:
                                invite
                                    .company
                                    .name,

                            role:
                                invite.role,
                        },
                    }
                );
            } catch (err) {
                const code =
                    isAxiosError(err)
                        ? (err.response
                              ?.data as
                              | {
                                    code?: string;
                                }
                              | undefined)
                              ?.code
                        : undefined;

                const message =
                    isAxiosError(err)
                        ? err.response
                              ?.data
                              ?.msg ??
                          err.response
                              ?.data
                              ?.message ??
                          "Unable to accept invitation."
                        : err instanceof
                            Error
                          ? err.message
                          : "Unable to accept invitation.";

                // The backend re-validates on every submit — any of these
                // means the token's state changed since /validate ran
                // (someone else claimed the email, it expired while the
                // form was open, it was revoked, etc). Re-route to the
                // right state instead of just toasting a generic error.
                if (code === "ACCOUNT_EXISTS") {
                    toast.error(message);
                    navigate(
                        `/invite/existing-user?token=${encodeURIComponent(
                            token
                        )}`,
                        { replace: true }
                    );
                    return;
                }

                if (
                    code ===
                        "INVITATION_EXPIRED" ||
                    code ===
                        "INVITATION_REVOKED" ||
                    code ===
                        "INVITATION_ACCEPTED"
                ) {
                    const status =
                        code ===
                        "INVITATION_EXPIRED"
                            ? "expired"
                            : code ===
                                "INVITATION_REVOKED"
                              ? "revoked"
                              : "already-accepted";

                    toast.error(message);
                    navigate(
                        `/invite/status/${status}?token=${encodeURIComponent(
                            token
                        )}`,
                        { replace: true }
                    );
                    return;
                }

                toast.error(message);
            } finally {
                setLoading(false);
            }
        };

    const inputClass =
        "w-full h-11 px-4 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all";

    return (
        <div className="flex flex-col gap-5">
            {/* Invitation summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                {[
                    {
                        label:
                            "Company",
                        value:
                            invite
                                .company
                                .name,
                    },
                    {
                        label: "Role",
                        value:
                            invite.role ===
                            "worker"
                                ? "Worker"
                                : "Manager",
                    },
                    {
                        label:
                            "Email",
                        value:
                            invite.email,
                    },
                ].map(
                    (
                        row,
                        index,
                        arr
                    ) => (
                        <div
                            key={
                                row.label
                            }
                            className={`flex items-center justify-between py-2 ${
                                index <
                                arr.length -
                                    1
                                    ? "border-b border-slate-100"
                                    : ""
                            }`}
                        >
                            <span className="text-sm text-slate-500">
                                {
                                    row.label
                                }
                            </span>

                            <span className="text-sm font-semibold text-slate-800 text-right">
                                {
                                    row.value
                                }
                            </span>
                        </div>
                    )
                )}
            </div>

            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Create your account
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                            Full name
                        </label>

                        <input
                            value={
                                fullname
                            }
                            onChange={(
                                e
                            ) =>
                                setFullname(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="John Smith"
                            className={
                                inputClass
                            }
                        />

                        {errors.fullname && (
                            <p className="text-xs text-red-500 mt-1">
                                {
                                    errors.fullname
                                }
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                            Email address
                        </label>

                        <input
                            value={
                                invite.email
                            }
                            readOnly
                            className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={
                                    passwordVisible
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    password
                                }
                                onChange={(
                                    e
                                ) =>
                                    setPassword(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                className={`${inputClass} pr-11`}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setPasswordVisible(
                                        (
                                            value
                                        ) =>
                                            !value
                                    )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {passwordVisible ? (
                                    <EyeOff
                                        size={
                                            16
                                        }
                                    />
                                ) : (
                                    <Eye
                                        size={
                                            16
                                        }
                                    />
                                )}
                            </button>
                        </div>

                        {errors.password ? (
                            <p className="text-xs text-red-500 mt-1">
                                {
                                    errors.password
                                }
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">
                                At
                                least
                                8
                                characters.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                            Confirm
                            password
                        </label>

                        <div className="relative">
                            <input
                                type={
                                    confirmVisible
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    confirmPassword
                                }
                                onChange={(
                                    e
                                ) =>
                                    setConfirmPassword(
                                        e
                                            .target
                                            .value
                                    )
                                }
                                className={`${inputClass} pr-11`}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setConfirmVisible(
                                        (
                                            value
                                        ) =>
                                            !value
                                    )
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            >
                                {confirmVisible ? (
                                    <EyeOff
                                        size={
                                            16
                                        }
                                    />
                                ) : (
                                    <Eye
                                        size={
                                            16
                                        }
                                    />
                                )}
                            </button>
                        </div>

                        {errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">
                                {
                                    errors.confirmPassword
                                }
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] disabled:opacity-60 transition-colors"
            >
                {loading
                    ? "Accepting invitation..."
                    : "Accept invitation & create account"}
            </button>
        </div>
    );
}