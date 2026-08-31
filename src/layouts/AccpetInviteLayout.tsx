import customFetch from "@/utils/customFetch";
import { Mail } from "lucide-react";
import {
    Outlet,
    useSearchParams,
} from "react-router";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import type {
    InviteData,
    InvitationOutletContext,
} from "../utils/types/invitation";

export default function InvitationLayout() {
    const [searchParams] =
        useSearchParams();

    const token =
        searchParams.get("token") ?? "";

    const [invite, setInvite] =
        useState<InviteData | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const refreshInvitation =
        useCallback(async () => {
            if (!token) {
                setError(
                    "Invitation token is missing."
                );

                setIsLoading(false);

                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const { data } =
                    await customFetch.get(
                        "/invitations/validate",
                        {
                            params: {
                                token,
                            },
                        }
                    );

                // The backend always returns a top-level `invitation` key —
                // an object for a real token, or explicit `null` for
                // status "invalid". Falling back further (e.g. to `data`
                // itself) would smuggle the whole {success,status,...}
                // envelope in as `invite` since `null` is nullish too.
                setInvite(data.invitation);
            } catch (err: any) {
                setInvite(null);

                setError(
                    err?.response?.data
                        ?.msg ??
                    err?.response?.data
                        ?.message ??
                    "Unable to validate this invitation."
                );
            } finally {
                setIsLoading(false);
            }
        }, [token]);

    useEffect(() => {
        refreshInvitation();
    }, [refreshInvitation]);

    const context: InvitationOutletContext =
    {
        token,
        invite,
        isLoading,
        error,
        refreshInvitation,
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex items-center gap-2.5 justify-center mb-8">
                    <div className="w-8 h-8 rounded-xl bg-[#1E3A5F] flex items-center justify-center">
                        <svg
                            viewBox="0 0 16 16"
                            width="14"
                            height="14"
                            fill="none"
                        >
                            <rect
                                x="1"
                                y="1"
                                width="5.5"
                                height="5.5"
                                rx="1.5"
                                fill="white"
                            />

                            <rect
                                x="9.5"
                                y="1"
                                width="5.5"
                                height="5.5"
                                rx="1.5"
                                fill="white"
                                opacity="0.6"
                            />

                            <rect
                                x="1"
                                y="9.5"
                                width="5.5"
                                height="5.5"
                                rx="1.5"
                                fill="white"
                                opacity="0.6"
                            />

                            <rect
                                x="9.5"
                                y="9.5"
                                width="5.5"
                                height="5.5"
                                rx="1.5"
                                fill="white"
                                opacity="0.3"
                            />
                        </svg>
                    </div>

                    <span className="text-base font-bold text-slate-800">
                        work
                        <span className="text-slate-300">
                            .wrk
                        </span>
                    </span>
                </div>
             
                {/* Invitation heading */}
                {!isLoading &&
                    invite &&
                    invite.status ===
                    "pending" && (
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-[#1E3A5F]/8 flex items-center justify-center mx-auto mb-4">
                                <Mail
                                    size={20}
                                    className="text-[#1E3A5F]"
                                />
                            </div>

                            <p className="text-xs font-bold uppercase tracking-widest text-[#1E3A5F] mb-1">
                                You're invited
                            </p>

                            <h1 className="text-xl font-bold text-slate-900">
                                Join{" "}
                                <span className="text-[#1E3A5F]">
                                    {
                                        invite
                                            .company
                                            .name
                                    }
                                </span>
                            </h1>

                            <p className="text-sm text-slate-500 mt-1.5">
                                {
                                    invite
                                        .invitedBy
                                        .fullname
                                }{" "}
                                invited you as a{" "}
                                <span className="font-semibold text-slate-700">
                                    {invite.role ===
                                        "worker"
                                        ? "Worker"
                                        : "Manager"}
                                </span>
                                .
                            </p>
                        </div>
                    )}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <Outlet
                        context={context}
                    />
                </div>

                <p className="text-xs text-slate-400 text-center mt-6">
                    Powered by{" "}
                    <span className="font-semibold text-slate-600">
                        work.wrk
                    </span>
                </p>
            </div>
        </div>
    );
}