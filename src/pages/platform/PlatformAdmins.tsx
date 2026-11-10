import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { ShieldCheck, UserPlus, Ban } from "lucide-react";
import { TH, TD, PlatformTable, THead, TBody, Row, EmptyRow, SearchInput, ConfirmModal } from "@/components/platform/figma/primitives";
import {
  platformAdminsQuery,
  grantPlatformAdmin,
  revokePlatformAdmin,
  type PlatformAdminListItem,
  type PlatformRole,
} from "@/utils/platform-api";

export const platformAdminsLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformAdminsQuery(params));
  return { searchValues: params };
};

const ROLE_LABEL: Record<PlatformRole, string> = {
  super_admin: "Super Admin",
  support_admin: "Support Admin",
  billing_admin: "Billing Admin",
};

export function PlatformAdmins() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const { data } = useQuery(platformAdminsQuery(searchValues));
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchValues.search ?? "");
  const [grantDialog, setGrantDialog] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] = useState<PlatformRole>("support_admin");
  const [revokeTarget, setRevokeTarget] = useState<PlatformAdminListItem | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["platform", "admins"] });

  const grantMutation = useMutation({
    mutationFn: (reason: string) => grantPlatformAdmin(grantEmail.trim().toLowerCase(), grantRole, reason),
    onSuccess: () => {
      toast.success("Platform access granted. This action has been recorded in the audit log.");
      invalidate();
      setGrantDialog(false);
      setGrantEmail("");
      setGrantRole("support_admin");
    },
    onError: (err: any) => toast.error(err.response?.data?.msg ?? "Failed to grant platform access."),
  });

  const revokeMutation = useMutation({
    mutationFn: (reason: string) => revokePlatformAdmin(revokeTarget!.id, reason),
    onSuccess: () => {
      toast.success("Platform access revoked. This action has been recorded in the audit log.");
      invalidate();
      setRevokeTarget(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.msg ?? "Failed to revoke platform access."),
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchValues);
    if (search) params.set("search", search);
    else params.delete("search");
    params.delete("page");
    navigate(`/platform/admins?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/admins?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Admins</h1>
          <p className="text-sm text-slate-500 mt-0.5">Who has super_admin, support_admin, or billing_admin access to this console.</p>
        </div>
        <button
          onClick={() => setGrantDialog(true)}
          className="h-9 px-3.5 flex items-center gap-1.5 text-sm font-semibold text-white bg-[#0F172A] rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        >
          <UserPlus size={14} /> Grant access
        </button>
      </div>

      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" className="flex-1 max-w-sm" />
      </form>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Role</TH>
            <TH>Granted</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={5}>
                <ShieldCheck size={20} className="text-slate-200 mx-auto mb-2" />
                No platform admins found.
              </EmptyRow>
            )}
            {data?.data.map((admin) => (
              <Row key={admin.id}>
                <TD className="font-semibold text-slate-800 text-sm">{admin.name}</TD>
                <TD className="text-xs text-slate-500">{admin.email}</TD>
                <TD>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {ROLE_LABEL[admin.platformRole]}
                  </span>
                </TD>
                <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(admin.createdAt).format("D MMM YYYY")}</TD>
                <TD onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setRevokeTarget(admin)}
                    className="h-7 px-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Ban size={11} /> Revoke
                  </button>
                </TD>
              </Row>
            ))}
          </TBody>
        </PlatformTable>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between rounded-b-lg">
            <p className="text-xs text-slate-400">{data.pagination.total} admins · page {data.pagination.page} of {data.pagination.totalPages}</p>
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

      {grantDialog && (
        <ConfirmModal
          title="Grant platform access"
          body="Grants one of the three platform roles to an existing OnClockly account. This cannot create a new account — the user must already have signed up."
          confirmLabel="Grant access"
          busy={grantMutation.isPending}
          onConfirm={(reason) => grantMutation.mutate(reason)}
          onClose={() => setGrantDialog(false)}
        >
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="person@example.com"
                className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Role</label>
              <select
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value as PlatformRole)}
                className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]/50"
              >
                {(Object.keys(ROLE_LABEL) as PlatformRole[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </div>
          </div>
        </ConfirmModal>
      )}

      {revokeTarget && (
        <ConfirmModal
          title={`Revoke ${revokeTarget.name}'s platform access?`}
          body={`They will lose ${ROLE_LABEL[revokeTarget.platformRole]} access immediately on their next request.`}
          confirmLabel="Revoke access"
          danger
          busy={revokeMutation.isPending}
          onConfirm={(reason) => revokeMutation.mutate(reason)}
          onClose={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
