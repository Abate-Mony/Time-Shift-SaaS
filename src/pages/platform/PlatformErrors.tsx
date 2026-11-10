import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { AlertOctagon, CreditCard, Mail, Timer, Check } from "lucide-react";
import { TH, TD, PlatformTable, THead, TBody, Row, EmptyRow } from "@/components/platform/figma/primitives";
import { platformErrorsQuery, resolvePlatformError, type PlatformErrorSource } from "@/utils/platform-api";

export const platformErrorsLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformErrorsQuery(params));
  return { searchValues: params };
};

const SOURCE_ICON: Record<PlatformErrorSource, typeof CreditCard> = {
  stripe_webhook: CreditCard,
  email: Mail,
  cron: Timer,
};

const SOURCE_LABEL: Record<PlatformErrorSource, string> = {
  stripe_webhook: "Stripe webhook",
  email: "Email",
  cron: "Cron job",
};

const FILTERS: Array<{ label: string; params: Record<string, string | undefined> }> = [
  { label: "All", params: {} },
  { label: "Unresolved", params: { resolved: "false" } },
  { label: "Stripe", params: { source: "stripe_webhook" } },
  { label: "Email", params: { source: "email" } },
  { label: "Cron", params: { source: "cron" } },
];

export function PlatformErrors() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const { data } = useQuery(platformErrorsQuery(searchValues));
  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: (errorId: string) => resolvePlatformError(errorId),
    onSuccess: () => {
      toast.success("Marked resolved.");
      queryClient.invalidateQueries({ queryKey: ["platform", "errors"] });
    },
    onError: () => toast.error("Failed to mark resolved."),
  });

  const applyFilter = (params: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) next.set(k, v); });
    navigate(`/platform/errors?${next.toString()}`);
  };

  const isActiveFilter = (params: Record<string, string | undefined>) => {
    const keys = ["resolved", "source"] as const;
    return keys.every((k) => (params[k] ?? "") === (searchValues[k] ?? ""));
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/errors?${params.toString()}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Error Log</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Persisted failures from Stripe webhooks, outbound email, and scheduled jobs — everything that used to only reach the server console.
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => applyFilter(f.params)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
              isActiveFilter(f.params) ? "bg-[#0F172A] text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <PlatformTable>
          <THead>
            <TH>Source</TH>
            <TH>Message</TH>
            <TH>Details</TH>
            <TH>Time</TH>
            <TH>Status</TH>
            <TH><span className="sr-only">Actions</span></TH>
          </THead>
          <TBody>
            {data?.data.length === 0 && (
              <EmptyRow colSpan={6}>
                <AlertOctagon size={20} className="text-slate-200 mx-auto mb-2" />
                No errors logged.
              </EmptyRow>
            )}
            {data?.data.map((e) => {
              const Icon = SOURCE_ICON[e.source];
              return (
                <Row key={e.id}>
                  <TD>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Icon size={12} className="text-slate-400" />
                      {SOURCE_LABEL[e.source]}
                    </span>
                  </TD>
                  <TD className="text-xs text-slate-700 max-w-[320px] truncate">
                    <span title={e.message}>{e.message}</span>
                  </TD>
                  <TD className="text-[11px] text-slate-400 font-mono max-w-[220px] truncate">
                    <span title={e.metadata ? JSON.stringify(e.metadata) : undefined}>{e.metadata ? JSON.stringify(e.metadata) : "—"}</span>
                  </TD>
                  <TD className="text-xs text-slate-400 whitespace-nowrap">{dayjs(e.createdAt).format("D MMM, HH:mm")}</TD>
                  <TD>
                    {e.resolved ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <Check size={10} /> Resolved
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700">Unresolved</span>
                    )}
                  </TD>
                  <TD onClick={(ev) => ev.stopPropagation()}>
                    {!e.resolved && (
                      <button
                        onClick={() => resolveMutation.mutate(e.id)}
                        disabled={resolveMutation.isPending}
                        className="h-7 px-2.5 text-xs font-semibold text-slate-600 border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors disabled:opacity-40"
                      >
                        Mark resolved
                      </button>
                    )}
                  </TD>
                </Row>
              );
            })}
          </TBody>
        </PlatformTable>

        {data && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC] flex items-center justify-between rounded-b-lg">
            <p className="text-xs text-slate-400">{data.pagination.total} errors · page {data.pagination.page} of {data.pagination.totalPages}</p>
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
    </div>
  );
}
