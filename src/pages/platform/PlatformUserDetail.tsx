import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ChevronLeft, Ban, RotateCcw } from "lucide-react";
import { Avatar, StatusBadge, RowMenu, ConfirmModal } from "@/components/platform/figma/primitives";
import { platformUserDetailQuery, updateUserStatus } from "@/utils/platform-api";

// No dedicated user-detail screen exists in the Figma source (only a Users
// list) — restyled with the same raw-markup primitives as the rest of the
// console for visual consistency, since there's nothing to literally port.
export const platformUserDetailLoader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
  await queryClient.ensureQueryData(platformUserDetailQuery(params.userId as string));
  return null;
};

export function PlatformUserDetail() {
  const { userId } = useParams() as { userId: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery(platformUserDetailQuery(userId));
  const [dialogOpen, setDialogOpen] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (vars: { status: "active" | "disabled"; reason: string }) => updateUserStatus(userId, vars.status, vars.reason),
    onSuccess: () => {
      toast.success("User status updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "users", userId] });
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update user status."),
  });

  if (!user) return null;
  const nextStatus = user.accountStatus === "active" ? "disabled" : "active";

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <button onClick={() => navigate("/platform/users")} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors">
          <ChevronLeft size={12} /> All users
        </button>
        <div className="flex items-start gap-4">
          <Avatar name={user.name} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <StatusBadge status={user.accountStatus} />
            </div>
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>
          </div>
          <RowMenu
            items={[
              user.accountStatus === "active"
                ? { label: "Disable account", icon: Ban, danger: true, onClick: () => setDialogOpen(true) }
                : { label: "Restore account", icon: RotateCcw, onClick: () => setDialogOpen(true) },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F8FAFC]">
          <div className="px-4 py-3"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company role</p></div>
          {[
            { label: "Company", value: user.company?.name ?? "—" },
            { label: "Role", value: <span className="capitalize">{user.role}</span> },
            { label: "Status", value: <StatusBadge status={user.accountStatus} /> },
          ].map((f) => (
            <div key={f.label} className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">{f.label}</span>
              <span className="text-xs font-semibold text-slate-700">{f.value}</span>
            </div>
          ))}
        </div>

        {/* Platform access is displayed in its own card, never merged with
            company role — the two are separate authorization domains. */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Platform access</p>
          {user.platformRole ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ring-1 bg-amber-50 text-amber-700 ring-amber-200 capitalize">
              {user.platformRole.replace("_", " ")}
            </span>
          ) : (
            <p className="text-sm text-slate-400">No platform access.</p>
          )}
        </div>

        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-lg divide-y divide-[#F8FAFC]">
          <div className="px-4 py-3"><p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</p></div>
          {[
            { label: "User ID", value: user.id },
            { label: "Created", value: dayjs(user.createdAt).format("D MMM YYYY") },
            { label: "Last login", value: user.lastLoginAt ? dayjs(user.lastLoginAt).format("D MMM YYYY, HH:mm") : "Never" },
          ].map((f) => (
            <div key={f.label} className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs text-slate-400">{f.label}</span>
              <span className="text-xs font-semibold text-slate-700">{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      {dialogOpen && (
        <ConfirmModal
          title={nextStatus === "disabled" ? `Disable ${user.name}?` : `Restore ${user.name}?`}
          body={
            nextStatus === "disabled"
              ? "This account will no longer be able to sign in. Note: an already-issued access token can keep working for up to 15 minutes until it naturally expires."
              : "This restores the account's ability to sign in."
          }
          confirmLabel={nextStatus === "disabled" ? "Disable user" : "Restore user"}
          danger={nextStatus === "disabled"}
          busy={statusMutation.isPending}
          onConfirm={(reason) => statusMutation.mutate({ status: nextStatus, reason })}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
