import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Eye, Ban, RotateCcw, Building2 } from "lucide-react";
import {
  Avatar, StatusBadge, TH, TD, PlatformTable, THead, TBody, Row, EmptyRow,
  RowMenu, ConfirmModal, SearchInput, PillFilter,
} from "@/components/platform/figma/primitives";
import { platformCompaniesQuery, updateCompanyStatus, type CompanyStatus } from "@/utils/platform-api";
import { useState } from "react";
import dayjs from "dayjs";

export const platformCompaniesLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformCompaniesQuery(params));
  return { searchValues: params };
};

const pct = (a: number, b: number) => (b === 0 ? "0%" : `${Math.min(100, Math.round((a / b) * 100))}%`);

export function PlatformCompanies() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const queryClient = useQueryClient();

  const { data } = useQuery(platformCompaniesQuery(searchValues));
  const [search, setSearch] = useState(searchValues.search ?? "");
  const [statusDialog, setStatusDialog] = useState<{ companyId: string; companyName: string; next: CompanyStatus } | null>(null);

  const statusMutation = useMutation({
    mutationFn: (vars: { companyId: string; status: CompanyStatus; reason: string }) =>
      updateCompanyStatus(vars.companyId, vars.status, vars.reason),
    onSuccess: () => {
      toast.success("Company status updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
      setStatusDialog(null);
    },
    onError: () => toast.error("Failed to update company status."),
  });

  const setParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchValues);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    navigate(`/platform/companies?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/companies?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Companies</h1>
        <p className="text-sm text-slate-500 mt-0.5">View and manage all organisations using OnClockly.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("search", search || undefined);
          }}
          className="flex-1 min-w-[220px] max-w-sm"
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, owner, domain…" />
        </form>

        <PillFilter
          options={["all", "active", "suspended", "disabled"] as const}
          value={(searchValues.status as "all" | "active" | "suspended" | "disabled") ?? "all"}
          onChange={(v) => setParam("status", v === "all" ? undefined : v)}
        />

        <select
          value={searchValues.plan ?? "all"}
          onChange={(e) => setParam("plan", e.target.value === "all" ? undefined : e.target.value)}
          className="h-8 px-3 border border-[#E2E8F0] rounded-lg text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/12"
        >
          <option value="all">All plans</option>
          {["free", "starter", "professional", "enterprise"].map((p) => (
            <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>Company</TH>
            <TH>Owner</TH>
            <TH>Plan</TH>
            <TH>Workers</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={7}>
                <Building2 size={20} className="text-slate-200 mx-auto mb-2" />
                No companies match these filters.
              </EmptyRow>
            )}
            {data?.data.map((company) => {
              const limit = company.workerUsage.limit ?? 0;
              const hasBar = !company.workerUsage.unlimited && limit > 0;
              return (
                <Row key={company.id} onClick={() => navigate(`/platform/companies/${company.id}`)}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={company.name} />
                      <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                    </div>
                  </TD>
                  <TD className="text-slate-500 text-xs">{company.owner?.email ?? "—"}</TD>
                  <TD><span className="text-xs font-semibold text-slate-700 capitalize">{company.plan}</span></TD>
                  <TD>
                    <div>
                      <span className="text-sm font-semibold text-slate-800">{company.workerUsage.active}</span>
                      <span className="text-xs text-slate-400"> / {company.workerUsage.unlimited ? "∞" : company.workerUsage.limit}</span>
                    </div>
                    {hasBar && (
                      <div className="w-24 h-1 bg-slate-100 rounded-full mt-1">
                        <div
                          className={`h-1 rounded-full ${company.workerUsage.active / limit > 0.9 ? "bg-amber-400" : "bg-blue-400"}`}
                          style={{ width: pct(company.workerUsage.active, limit) }}
                        />
                      </div>
                    )}
                  </TD>
                  <TD><StatusBadge status={company.status} /></TD>
                  <TD className="text-slate-500 text-xs whitespace-nowrap">{dayjs(company.createdAt).format("D MMM YYYY")}</TD>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      items={[
                        { label: "View company", icon: Eye, onClick: () => navigate(`/platform/companies/${company.id}`) },
                        company.status === "active"
                          ? { label: "Suspend company", icon: Ban, danger: true, onClick: () => setStatusDialog({ companyId: company.id, companyName: company.name, next: "suspended" }) }
                          : { label: "Restore company", icon: RotateCcw, onClick: () => setStatusDialog({ companyId: company.id, companyName: company.name, next: "active" }) },
                      ]}
                    />
                  </TD>
                </Row>
              );
            })}
          </TBody>
        </PlatformTable>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between rounded-b-lg">
            <p className="text-xs text-slate-400">
              {data.pagination.total} compan{data.pagination.total === 1 ? "y" : "ies"} · page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={data.pagination.page <= 1}
                onClick={() => goToPage(data.pagination.page - 1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs text-slate-500 px-2">Page {data.pagination.page} of {data.pagination.totalPages}</span>
              <button
                disabled={data.pagination.page >= data.pagination.totalPages}
                onClick={() => goToPage(data.pagination.page + 1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {statusDialog && (
          <ConfirmModal
            title={statusDialog.next === "active" ? `Restore ${statusDialog.companyName}?` : `Suspend ${statusDialog.companyName}?`}
            body={
              statusDialog.next === "active"
                ? "This will restore full access for this company's users."
                : "Users from this company will no longer be able to access OnClockly until the company is restored."
            }
            consequence={statusDialog.next === "suspended" ? "All active sessions will be terminated. Workers will be unable to clock in or out." : undefined}
            confirmLabel={statusDialog.next === "active" ? "Restore company" : "Suspend company"}
            danger={statusDialog.next !== "active"}
            busy={statusMutation.isPending}
            onConfirm={(reason) => statusMutation.mutate({ companyId: statusDialog.companyId, status: statusDialog.next, reason })}
            onClose={() => setStatusDialog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
