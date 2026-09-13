import type { InviteData } from "@/utils/types/invitation";

interface Props {
    invite: InviteData;
}

export default function InvitationSummary({
    invite,
}: Props) {
    const rows = [
        {
            label: "Company",
            value: invite.company,
        },
        {
            label: "Role",
            value:
                invite.role === "worker"
                    ? "Worker"
                    : "Manager",
        },
        {
            label: "Email",
            value: invite.email,
        },
    ];

    return (
        <div className="bg-muted border border-border rounded-xl px-5 py-4 mb-6">
            {rows.map((row, i) => (
                <div
                    key={row.label}
                    className={`flex items-center justify-between py-2 ${
                        i < rows.length - 1
                            ? "border-b border-border"
                            : ""
                    }`}
                >
                    <span className="text-sm text-muted-foreground">
                        {row.label}
                    </span>

                    <span className="text-sm font-semibold text-foreground">
                        {/* {row.value} */}
                    </span>
                </div>
            ))}
        </div>
    );
}