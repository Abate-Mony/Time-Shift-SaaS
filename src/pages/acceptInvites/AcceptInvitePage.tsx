import {
    Navigate,
    useOutletContext,
} from "react-router";


import type {
    InvitationOutletContext,
} from "../../utils/types/invitation";

export default function AcceptInvitePage() {
    const {
        token,
        invite,
        isLoading,
        error,
    } =
        useOutletContext<InvitationOutletContext>();
console.log("toekn")
    if (isLoading) {
        return (
            <div className="animate-pulse flex flex-col gap-4">
                <div className="h-5 bg-slate-200 rounded-lg w-2/3 mx-auto" />

                <div className="h-4 bg-slate-200 rounded-lg w-1/2 mx-auto" />

                <div className="h-20 bg-slate-100 rounded-xl mt-2" />

                <div className="h-11 bg-slate-200 rounded-xl" />

                <div className="h-11 bg-slate-200 rounded-xl" />
            </div>
        );
    }

    if (error || !invite) {
        return (
            <Navigate
                to={`/invite/status/invalid?token=${encodeURIComponent(
                    token
                )}`}
                replace
            />
        );
    }

    if (
        invite.status === "expired"
    ) {
        return (
            <Navigate
                to={`/invite/status/expired?token=${encodeURIComponent(
                    token
                )}`}
                replace
            />
        );
    }

    if (
        invite.status === "revoked"
    ) {
        return (
            <Navigate
                to={`/invite/status/revoked?token=${encodeURIComponent(
                    token
                )}`}
                replace
            />
        );
    }

    if (
        invite.status === "accepted"
    ) {
        return (
            <Navigate
                to={`/invite/status/already-accepted?token=${encodeURIComponent(
                    token
                )}`}
                replace
            />
        );
    }

    if (
        invite.accountExists
    ) {
        return (
            <Navigate
                to={`/invite/existing-user?token=${encodeURIComponent(
                    token
                )}`}
                replace
            />
        );
    }

    return (
        <Navigate
            to={`/invite/new-user?token=${encodeURIComponent(
                token
            )}`}
            replace
        />
    );
}