import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useParams, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { ReasonConfirmDialog } from "@/components/platform/ReasonConfirmDialog";
import { platformUserDetailQuery, updateUserStatus } from "@/utils/platform-api";

export const platformUserDetailLoader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
  await queryClient.ensureQueryData(platformUserDetailQuery(params.userId as string));
  return null;
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function PlatformUserDetail() {
  const { userId } = useParams() as { userId: string };
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
    <div className="space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{user.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Button variant={user.accountStatus === "active" ? "destructive" : "default"} size="sm" onClick={() => setDialogOpen(true)}>
          {user.accountStatus === "active" ? "Disable user" : "Restore user"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Company role</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Company" value={user.company?.name ?? "—"} />
            <InfoRow label="Role" value={<span className="capitalize">{user.role}</span>} />
            <InfoRow label="Status" value={<PlatformStatusBadge status={user.accountStatus} />} />
          </CardContent>
        </Card>

        {/* Platform access is displayed in its own card, never merged with
            company role — the two are separate authorization domains. */}
        <Card>
          <CardHeader><CardTitle>Platform access</CardTitle></CardHeader>
          <CardContent>
            {user.platformRole ? (
              <Badge className="capitalize">{user.platformRole.replace("_", " ")}</Badge>
            ) : (
              <p className="text-sm text-muted-foreground">No platform access.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="User ID" value={user.id} />
            <InfoRow label="Created" value={dayjs(user.createdAt).format("D MMM YYYY")} />
            <InfoRow label="Last login" value={user.lastLoginAt ? dayjs(user.lastLoginAt).format("D MMM YYYY, HH:mm") : "Never"} />
          </CardContent>
        </Card>
      </div>

      <ReasonConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={nextStatus === "disabled" ? `Disable ${user.name}?` : `Restore ${user.name}?`}
        description={
          nextStatus === "disabled"
            ? "This account will no longer be able to sign in. Note: an already-issued access token can keep working for up to 15 minutes until it naturally expires."
            : "This restores the account's ability to sign in."
        }
        confirmLabel={nextStatus === "disabled" ? "Disable user" : "Restore user"}
        destructive={nextStatus === "disabled"}
        busy={statusMutation.isPending}
        onConfirm={(reason) => statusMutation.mutate({ status: nextStatus, reason })}
      />
    </div>
  );
}
