import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { platformOverviewQuery } from "@/utils/platform-api";
import dayjs from "dayjs";

export const platformOverviewLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformOverviewQuery);
  return null;
};

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function PlatformOverview() {
  const { data: overview } = useQuery(platformOverviewQuery);
  if (!overview) return null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Platform Overview</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Monitor companies, users and platform activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total Companies" value={overview.companies.total} hint={`+${overview.companies.newThisMonth} this month`} />
        <MetricCard
          label="Active Companies"
          value={overview.companies.active}
          hint={overview.companies.total > 0 ? `${((overview.companies.active / overview.companies.total) * 100).toFixed(1)}% of total` : undefined}
        />
        <MetricCard label="Active Workers" value={overview.users.activeWorkers} hint="Across all companies" />
        <MetricCard
          label="Sending Domains"
          value={overview.email.verifiedDomains}
          hint={overview.email.failedDomains > 0 ? `${overview.email.failedDomains} failed` : "Verified"}
        />
      </div>

      {/* Subscriptions/trials/MRR intentionally omitted — no billing or
          trial data exists in this backend yet (see the platform API's own
          overview endpoint comment). Showing zeros here would be fabricated
          data, not a real metric. */}

      <Card>
        <CardHeader>
          <CardTitle>Needs Attention</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.attention.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nothing needs attention right now.</p>
          ) : (
            <div className="divide-y divide-border">
              {overview.attention.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground">{item.company.name}</p>
                    </div>
                  </div>
                  <Link
                    to={`/platform/companies/${item.company.id}`}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    Review
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.recentActivity.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No platform activity yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {overview.recentActivity.map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <PlatformStatusBadge status={event.result} />
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{event.actorEmail}</span> · {event.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.targetType} {event.targetId}</p>
                    </div>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{dayjs(event.createdAt).format("D MMM, HH:mm")}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
