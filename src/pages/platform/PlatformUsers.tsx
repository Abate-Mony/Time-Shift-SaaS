import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, Ban, RotateCcw, Users as UsersIcon } from "lucide-react";
import {
  StatusBadge, TH, TD, PlatformTable, THead, TBody, Row, EmptyRow,
  RowMenu, ConfirmModal, SearchInput,
} from "@/components/platform/figma/primitives";
import { platformUsersQuery, updateUserStatus } from "@/utils/platform-api";
import { useState } from "react";
import dayjs from "dayjs";

export const platformUsersLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformUsersQuery(params));
  return { searchValues: params };
};

export function PlatformUsers() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const queryClient = useQueryClient();

  const { data } = useQuery(platformUsersQuery(searchValues));
  const [search, setSearch] = useState(searchValues.search ?? "");
  const [statusDialog, setStatusDialog] = useState<{ userId: string; name: string; next: "active" | "disabled" } | null>(null);

  const statusMutation = useMutation({
    mutationFn: (vars: { userId: string; status: "active" | "disabled"; reason: string }) =>
      updateUserStatus(vars.userId, vars.status, vars.reason),
    onSuccess: () => {
      toast.success("User status updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "users"] });
      setStatusDialog(null);
    },
    onError: () => toast.error("Failed to update user status."),
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchValues);
    if (search) params.set("search", search);
    else params.delete("search");
    params.delete("page");
    navigate(`/platform/users?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/users?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500 mt-0.5">Cross-company user search and management.</p>
      </div>

      <form onSubmit={submitSearch} className="max-w-sm">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or company…" />
      </form>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>User</TH>
            <TH>Company</TH>
            <TH>Company role</TH>
            <TH>Platform access</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={7}>
                <UsersIcon size={20} className="text-slate-200 mx-auto mb-2" />
                No users match this search.
              </EmptyRow>
            )}
            {data?.data.map((user) => (
              <Row key={user.id} onClick={() => navigate(`/platform/users/${user.id}`)}>
                <TD>
                  <p className="font-semibold text-slate-800 text-sm">{user.name}</p>
                  <p className="text-[11px] text-slate-400">{user.email}</p>
                </TD>
                <TD className="text-xs text-slate-600">{user.company?.name ?? "—"}</TD>
                <TD><span className="text-xs font-semibold capitalize text-slate-700">{user.role}</span></TD>
                <TD>
                  {user.platformRole ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ring-1 bg-amber-50 text-amber-700 ring-amber-200 capitalize">
                      {user.platformRole.replace("_", " ")}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-300">—</span>
                  )}
                </TD>
                <TD><StatusBadge status={user.accountStatus} /></TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(user.createdAt).format("D MMM YYYY")}</TD>
                <TD onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    items={[
                      { label: "View user", icon: Eye, onClick: () => navigate(`/platform/users/${user.id}`) },
                      user.accountStatus === "active"
                        ? { label: "Disable account", icon: Ban, danger: true, onClick: () => setStatusDialog({ userId: user.id, name: user.name, next: "disabled" }) }
                        : { label: "Restore account", icon: RotateCcw, onClick: () => setStatusDialog({ userId: user.id, name: user.name, next: "active" }) },
                    ]}
                  />
                </TD>
              </Row>
            ))}
          </TBody>
        </PlatformTable>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between rounded-b-lg">
            <p className="text-xs text-slate-400">{data.pagination.total} users · page {data.pagination.page} of {data.pagination.totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => goToPage(data.pagination.page - 1)}
                className="h-7 px-2.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => goToPage(data.pagination.page + 1)}
                className="h-7 px-2.5 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {statusDialog && (
          <ConfirmModal
            title={statusDialog.next === "active" ? `Restore ${statusDialog.name}?` : `Disable ${statusDialog.name}?`}
            body={
              statusDialog.next === "active"
                ? "This restores the account's ability to sign in."
                : "This account will no longer be able to sign in. Note: an already-issued access token can keep working for up to 15 minutes until it naturally expires."
            }
            confirmLabel={statusDialog.next === "active" ? "Restore account" : "Disable account"}
            danger={statusDialog.next !== "active"}
            busy={statusMutation.isPending}
            onConfirm={(reason) => statusMutation.mutate({ userId: statusDialog.userId, status: statusDialog.next, reason })}
            onClose={() => setStatusDialog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
