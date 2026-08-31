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
import toast from "react-hot-toast";

import {
    Navigate,
    useNavigate,
    useOutletContext,
} from "react-router";

import type {
    InvitationOutletContext,
} from "../../utils/types/invitation";

export default function ExistingUserInvitePage() {
    const navigate =
        useNavigate();

    const {
        token,
        invite,
        isLoading,
    } =
        useOutletContext<InvitationOutletContext>();

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-20 rounded-xl bg-slate-100" />
                <div className="h-11 rounded-xl bg-slate-200" />
                <div className="h-11 rounded-xl bg-slate-200" />
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

    const submit = async () => {
        if (!password) {
            setError(
                "Enter your password."
            );

            return;
        }

        setError("");
        setLoading(true);

        try {
            // Step 1: authenticate the existing account.
            try {
                await customFetch.post(
                    "/auth/login",
                    {
                        email:
                            invite.email,
                        password,
                    }
                );
            } catch (err) {
                const message =
                    isAxiosError(err)
                        ? err.response
                              ?.data
                              ?.msg ??
                          err.response
                              ?.data
                              ?.message ??
                          "Incorrect password."
                        : "Incorrect password.";

                setError(message);
                return;
            }

            // Step 2: attach the now-authenticated user to the invitation.
            // This is a separate endpoint from new-user acceptance — it
            // needs a real session to know *which* account is accepting.
            await customFetch.post(
                "/invitations/accept-existing",
                {
                    token,
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
                            invite.company
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
                    ? err.response?.data
                          ?.msg ??
                      err.response?.data
                          ?.message ??
                      "Unable to accept invitation."
                    : err instanceof Error
                      ? err.message
                      : "Unable to accept invitation.";

            // Wrong account signed in — the login succeeded, but it isn't
            // the account this invitation was sent to.
            if (
                code ===
                "INVITATION_EMAIL_MISMATCH"
            ) {
                setError(
                    `This invitation was sent to ${invite.email}, but you're signed in as a different account. Sign out and sign in with the invited email.`
                );
                return;
            }

            // No multi-company support in this backend — an account can
            // only ever belong to one company, so this is a hard stop.
            if (
                code ===
                "ALREADY_IN_ANOTHER_COMPANY"
            ) {
                setError(
                    "This account already belongs to a different company and can't accept this invitation."
                );
                return;
            }

            // The token's state changed since /validate ran (revoked,
            // expired, or already used from another tab/device) — send
            // the user to the matching status state instead of a toast.
            if (
                code ===
                    "INVITATION_EXPIRED" ||
                code ===
                    "INVITATION_REVOKED" ||
                code === "INVITATION_ACCEPTED"
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

    return (
        <div className="flex flex-col gap-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">
                        Company
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                        {
                            invite.company
                                .name
                        }
                    </span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-500">
                        Role
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                        {invite.role ===
                        "worker"
                            ? "Worker"
                            : "Manager"}
                    </span>
                </div>

                <div className="flex justify-between py-2">
                    <span className="text-sm text-slate-500">
                        Email
                    </span>

                    <span className="text-sm font-semibold text-slate-800">
                        {
                            invite.email
                        }
                    </span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                    You already have an
                    account
                </h3>

                <p className="text-sm text-slate-500 mb-4">
                    Sign in to accept your
                    invitation to{" "}
                    <strong className="text-slate-700">
                        {
                            invite.company
                                .name
                        }
                    </strong>
                    .
                </p>

                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                    Email address
                </label>

                <input
                    value={invite.email}
                    readOnly
                    className="w-full h-11 px-4 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-500 mb-4"
                />

                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                    Password
                </label>

                <div className="relative">
                    <input
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target
                                    .value
                            )
                        }
                        className="w-full h-11 px-4 pr-11 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (value) =>
                                    !value
                            )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                        {showPassword ? (
                            <EyeOff
                                size={16}
                            />
                        ) : (
                            <Eye
                                size={16}
                            />
                        )}
                    </button>
                </div>

                {error && (
                    <p className="text-xs text-red-500 mt-1">
                        {error}
                    </p>
                )}

                {/* <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/forgot-password"
                        )
                    }
                    className="text-xs text-[#1E3A5F] font-semibold mt-2 hover:underline"
                >
                    Forgot password?
                </button> */}
            </div>

            <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full h-11 bg-[#1E3A5F] text-white text-sm font-bold rounded-xl hover:bg-[#162D4A] disabled:opacity-60"
            >
                {loading
                    ? "Signing in..."
                    : "Sign in & accept invitation"}
            </button>
        </div>
    );
}