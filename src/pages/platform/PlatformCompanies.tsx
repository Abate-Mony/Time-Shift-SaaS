import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Eye, Ban, RotateCcw, Building2 } from "lucide-react";
import {
  Avatar, StatusBadge, TH, TD, PlatformTable, THead, TBody, Row, EmptyRow,
  RowMenu, ConfirmModal, SearchInput, PillFilter,
} from "@/components/platform/figma/primitives";
import {
  platformCompaniesQuery, updateCompanyStatus, bulkUpdateCompanyStatus, bulkUpdateCompanyTags,
  type CompanyStatus, type PlatformTag,
} from "@/utils/platform-api";
import { HealthBadge, TagChip, TAG_LABELS } from "@/components/platform/SupportBits";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
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
  const { isSuper, canSupport } = usePlatformPermissions();
  const [search, setSearch] = useState(searchValues.search ?? "");
  const [statusDialog, setStatusDialog] = useState<{ companyId: string; companyName: string; next: CompanyStatus } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatusDialog, setBulkStatusDialog] = useState<CompanyStatus | null>(null);
  const [bulkTagDialog, setBulkTagDialog] = useState(false);
  const [bulkTags, setBulkTags] = useState<PlatformTag[]>([]);

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

  const bulkResultToast = (data: { succeeded: string[]; failed: { companyId: string; error: string }[] }) => {
    toast[data.failed.length === 0 ? "success" : "error"](
      `${data.succeeded.length} compan${data.succeeded.length === 1 ? "y" : "ies"} updated${data.failed.length ? `, ${data.failed.length} failed` : ""}.`
    );
    queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
    setSelectedIds(new Set());
  };

  const bulkStatusMutation = useMutation({
    mutationFn: (vars: { status: CompanyStatus; reason: string }) =>
      bulkUpdateCompanyStatus(Array.from(selectedIds), vars.status, vars.reason),
    onSuccess: (data) => { bulkResultToast(data); setBulkStatusDialog(null); },
    onError: () => toast.error("Failed to update companies."),
  });

  const bulkTagMutation = useMutation({
    mutationFn: (reason: string) => bulkUpdateCompanyTags(Array.from(selectedIds), bulkTags, reason),
    onSuccess: (data) => { bulkResultToast(data); setBulkTagDialog(false); setBulkTags([]); },
    onError: () => toast.error("Failed to update tags."),
  });

  const pageIds = data?.data.map((c) => c.id) ?? [];
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    setSelectedIds(allOnPageSelected ? new Set() : new Set(pageIds));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const setParam = (key: string, value: string | undefined) => {
    setSelectedIds(new Set());
    const params = new URLSearchParams(searchValues);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    navigate(`/platform/companies?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    setSelectedIds(new Set());
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

        <select
          aria-label="Health"
          value={searchValues.health ?? "all"}
          onChange={(e) => setParam("health", e.target.value === "all" ? undefined : e.target.value)}
          className={`h-8 px-3 border rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/12 ${searchValues.health === "at_risk" ? "border-red-300 text-red-700 font-semibold" : "border-[#E2E8F0] text-slate-600"}`}
        >
          <option value="all">Any health</option>
          <option value="at_risk">At risk</option>
          <option value="watch">Watch</option>
          <option value="healthy">Healthy</option>
        </select>

        <select
          aria-label="Tag"
          value={searchValues.tag ?? "all"}
          onChange={(e) => setParam("tag", e.target.value === "all" ? undefined : e.target.value)}
          className="h-8 px-3 border border-[#E2E8F0] rounded-lg text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/12"
        >
          <option value="all">Any tag</option>
          {(Object.keys(TAG_LABELS) as PlatformTag[]).map((t) => (
            <option key={t} value={t}>{TAG_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#1E3A5F]/6 border border-[#1E3A5F]/15 rounded-lg px-4 py-2.5">
          <span className="text-xs font-semibold text-[#1E3A5F]">{selectedIds.size} selected</span>
          {isSuper && (
            <>
              <button
                onClick={() => setBulkStatusDialog("suspended")}
                className="h-7 px-2.5 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-md hover:bg-red-50 transition-colors"
              >
                Suspend
              </button>
              <button
                onClick={() => setBulkStatusDialog("active")}
                className="h-7 px-2.5 text-xs font-semibold text-slate-600 bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors"
              >
                Restore
              </button>
            </>
          )}
          {canSupport && (
            <button
              onClick={() => setBulkTagDialog(true)}
              className="h-7 px-2.5 text-xs font-semibold text-slate-600 bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors"
            >
              Set tags
            </button>
          )}
          <button onClick={() => setSelectedIds(new Set())} className="h-7 px-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors ml-auto">
            Clear
          </button>
        </div>
      )}

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>
              <input
                type="checkbox"
                aria-label="Select all on this page"
                checked={allOnPageSelected}
                onChange={toggleSelectAll}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1E3A5F]"
              />
            </TH>
            <TH>Company</TH>
            <TH>Owner</TH>
            <TH>Plan</TH>
            <TH>Health</TH>
            <TH>Workers</TH>
            <TH>Status</TH>
            <TH>Created</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={9}>
                <Building2 size={20} className="text-slate-200 mx-auto mb-2" />
                No companies match these filters.
              </EmptyRow>
            )}
            {data?.data.map((company) => {
              const limit = company.workerUsage.limit ?? 0;
              const hasBar = !company.workerUsage.unlimited && limit > 0;
              return (
                <Row key={company.id} onClick={() => navigate(`/platform/companies/${company.id}`)}>
                  <TD onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${company.name}`}
                      checked={selectedIds.has(company.id)}
                      onChange={() => toggleSelect(company.id)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-[#1E3A5F]"
                    />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={company.name} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm">{company.name}</p>
                        {(company.tags?.length > 0 || company.deletionScheduledAt) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {company.deletionScheduledAt && (
                              <span className="inline-flex items-center h-5 px-1.5 rounded border text-[10px] font-semibold bg-red-50 text-red-800 border-red-200">
                                Deleting {dayjs(company.deletionScheduledAt).format("D MMM")}
                              </span>
                            )}
                            {company.tags?.map((t) => <TagChip key={t} tag={t} />)}
                          </div>
                        )}
                      </div>
                    </div>
                  </TD>
                  <TD className="text-slate-500 text-xs">{company.owner?.email ?? "—"}</TD>
                  <TD><span className="text-xs font-semibold text-slate-700 capitalize">{company.plan}</span></TD>
                  <TD>
                    {company.health ? (
                      <HealthBadge level={company.health.level} score={company.health.score} title={company.health.reasons.join("\n") || "No issues"} />
                    ) : "—"}
                  </TD>
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
                        ...(!isSuper ? [] : [company.status === "active"
                          ? { label: "Suspend company", icon: Ban, danger: true, onClick: () => setStatusDialog({ companyId: company.id, companyName: company.name, next: "suspended" }) }
                          : { label: "Restore company", icon: RotateCcw, onClick: () => setStatusDialog({ companyId: company.id, companyName: company.name, next: "active" }) }]),
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
        {bulkStatusDialog && (
          <ConfirmModal
            title={bulkStatusDialog === "active" ? `Restore ${selectedIds.size} companies?` : `Suspend ${selectedIds.size} companies?`}
            body={
              bulkStatusDialog === "active"
                ? "This will restore full access for every selected company's users."
                : "Users from every selected company will no longer be able to access OnClockly until restored."
            }
            consequence={bulkStatusDialog === "suspended" ? "All active sessions will be terminated for each company. Workers will be unable to clock in or out." : undefined}
            confirmLabel={bulkStatusDialog === "active" ? "Restore companies" : "Suspend companies"}
            danger={bulkStatusDialog !== "active"}
            busy={bulkStatusMutation.isPending}
            onConfirm={(reason) => bulkStatusMutation.mutate({ status: bulkStatusDialog, reason })}
            onClose={() => setBulkStatusDialog(null)}
          />
        )}
        {bulkTagDialog && (
          <ConfirmModal
            title={`Set tags for ${selectedIds.size} companies?`}
            body="This replaces each selected company's tags with exactly the set chosen below — it does not add to their existing tags."
            confirmLabel="Set tags"
            showReason={false}
            busy={bulkTagMutation.isPending}
            onConfirm={(reason) => bulkTagMutation.mutate(reason)}
            onClose={() => { setBulkTagDialog(false); setBulkTags([]); }}
          >
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TAG_LABELS) as PlatformTag[]).map((t) => {
                const active = bulkTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBulkTags((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={`h-7 px-2.5 text-xs font-semibold rounded-full border transition-colors ${
                      active ? "bg-[#1E3A5F] text-white border-[#1E3A5F]" : "bg-white text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
                    }`}
                  >
                    {TAG_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </ConfirmModal>
        )}
      </AnimatePresence>
    </div>
  );
}
