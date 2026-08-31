export type InvitationRole =
    | "worker"
    | "manager";

export type InvitationStatus =
    | "pending"
    | "accepted"
    | "expired"
    | "revoked"
    | "invalid";

export interface InviteData {
    _id: string;

    company: {
        _id: string;
        name: string;
        logo?: string;
    };

    email: string;

    fullname?: string;

    role: InvitationRole;

    invitedBy: {
        _id: string;
        fullname: string;
    };

    status: InvitationStatus;

    expiresAt: string;

    accountExists: boolean;
}

export interface InvitationOutletContext {
    token: string;

    invite: InviteData | null;

    isLoading: boolean;

    error: string | null;

    refreshInvitation: () => Promise<void>;
}