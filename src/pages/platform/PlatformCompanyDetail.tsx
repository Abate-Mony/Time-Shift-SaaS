import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useParams, type LoaderFunctionArgs } from "react-router";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { ReasonConfirmDialog } from "@/components/platform/ReasonConfirmDialog";
import {
  platformCompanyDetailQuery,
  platformCompanyUsersQuery,
  platformCompanyUsageQuery,
  platformCompanyEmailQuery,
  platformAuditQuery,
  updateCompanyStatus,
  updateCompanyPlanOverride,
  retryEmailDomainVerification,
  resetEmailDomain,
  type Plan,
  type CompanyStatus,
} from "@/utils/platform-api";

export const platformCompanyDetailLoader = (queryClient: QueryClient) => async ({ params }: LoaderFunctionArgs) => {
  const companyId = params.companyId as string;
  await queryClient.ensureQueryData(platformCompanyDetailQuery(companyId));
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

export function PlatformCompanyDetail() {
  const { companyId } = useParams() as { companyId: string };
  const queryClient = useQueryClient();
  const { data: company } = useQuery(platformCompanyDetailQuery(companyId));

  const [statusDialog, setStatusDialog] = useState<CompanyStatus | null>(null);
  const [planDialog, setPlanDialog] = useState<Plan | null>(null);
  const [resetDialog, setResetDialog] = useState(false);

  const statusMutation = useMutation({
    mutationFn: (vars: { status: CompanyStatus; reason: string }) => updateCompanyStatus(companyId, vars.status, vars.reason),
    onSuccess: () => {
      toast.success("Company status updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
      queryClient.invalidateQueries({ queryKey: ["platform", "companies"] });
      setStatusDialog(null);
    },
    onError: () => toast.error("Failed to update company status."),
  });

  const planMutation = useMutation({
    mutationFn: (vars: { plan: Plan; reason: string }) => updateCompanyPlanOverride(companyId, vars.plan, vars.reason),
    onSuccess: () => {
      toast.success("Company plan updated. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId] });
      setPlanDialog(null);
    },
    onError: () => toast.error("Failed to update company plan."),
  });

  const resetDomainMutation = useMutation({
    mutationFn: (reason: string) => resetEmailDomain(companyId, reason),
    onSuccess: () => {
      toast.success("Sending domain reset. This action has been recorded in the audit log.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "email"] });
      setResetDialog(false);
    },
    onError: () => toast.error("Failed to reset the sending domain."),
  });

  const retryVerificationMutation = useMutation({
    mutationFn: () => retryEmailDomainVerification(companyId),
    onSuccess: () => {
      toast.success("Verification re-checked.");
      queryClient.invalidateQueries({ queryKey: ["platform", "companies", companyId, "email"] });
    },
    onError: () => toast.error("Failed to retry verification."),
  });

  if (!company) return null;

  return (
    <div className="space-y-5 p-6">
      {company.status !== "active" && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4">
            <p className="text-sm font-semibold text-amber-900">
              Company {company.status === "suspended" ? "suspended" : "disabled"}
            </p>
            <p className="mt-0.5 text-sm text-amber-800">Users from this company cannot access INPRN.</p>
            <Button size="sm" className="mt-3" onClick={() => setStatusDialog("active")}>
              Restore company
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{company.name}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <PlatformStatusBadge status={company.status} />
            <span className="text-xs text-muted-foreground capitalize">{company.plan}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {company.status === "active" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStatusDialog("suspended")}>
                Suspend company
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setStatusDialog("disabled")}>
                Disable company
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Company ID" value={company.id} />
              <InfoRow label="Owner" value={company.owner?.email ?? "—"} />
              <InfoRow label="Business type" value={company.businessType ?? "—"} />
              <InfoRow label="Country" value={company.country ?? "—"} />
              <InfoRow label="Created" value={dayjs(company.createdAt).format("D MMM YYYY")} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setPlanDialog(company.plan)}>
                  Change plan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <InfoRow label="Current plan" value={<span className="capitalize">{company.plan}</span>} />
              <InfoRow
                label="Worker seats"
                value={`${company.workerUsage.active} / ${company.workerUsage.unlimited ? "Unlimited" : company.workerUsage.limit}`}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Product Usage</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(company.counts).map(([key, value]) => (
                <div key={key}>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                  <p className="text-xs capitalize text-muted-foreground">{key}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <CompanyUsersTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="usage">
          <CompanyUsageTab companyId={companyId} />
        </TabsContent>

        <TabsContent value="email">
          <CompanyEmailTab
            companyId={companyId}
            onRetry={() => retryVerificationMutation.mutate()}
            retrying={retryVerificationMutation.isPending}
            onReset={() => setResetDialog(true)}
          />
        </TabsContent>

        <TabsContent value="activity">
          <CompanyActivityTab companyId={companyId} />
        </TabsContent>
      </Tabs>

      <ReasonConfirmDialog
        open={statusDialog !== null}
        onOpenChange={(open) => !open && setStatusDialog(null)}
        title={
          statusDialog === "active"
            ? `Restore ${company.name}?`
            : statusDialog === "suspended"
              ? `Suspend ${company.name}?`
              : `Disable ${company.name}?`
        }
        description={
          statusDialog === "active"
            ? "This will restore full access for this company's users."
            : "Users from this company will no longer be able to access INPRN until the company is restored."
        }
        confirmLabel={statusDialog === "active" ? "Restore company" : statusDialog === "suspended" ? "Suspend company" : "Disable company"}
        destructive={statusDialog !== "active"}
        busy={statusMutation.isPending}
        onConfirm={(reason) => statusDialog && statusMutation.mutate({ status: statusDialog, reason })}
      />

      <PlanChangeDialog
        open={planDialog !== null}
        currentPlan={company.plan}
        onOpenChange={(open) => !open && setPlanDialog(null)}
        busy={planMutation.isPending}
        onConfirm={(plan, reason) => planMutation.mutate({ plan, reason })}
      />

      <ReasonConfirmDialog
        open={resetDialog}
        onOpenChange={setResetDialog}
        title="Reset sending domain?"
        description="This clears the custom sending domain configuration. Email sending falls back to the INPRN default sender immediately."
        confirmLabel="Reset domain"
        destructive
        busy={resetDomainMutation.isPending}
        onConfirm={(reason) => resetDomainMutation.mutate(reason)}
      />
    </div>
  );
}

function PlanChangeDialog({
  open,
  currentPlan,
  onOpenChange,
  busy,
  onConfirm,
}: {
  open: boolean;
  currentPlan: Plan;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onConfirm: (plan: Plan, reason: string) => void;
}) {
  const [plan, setPlan] = useState<Plan>(currentPlan);
  return (
    <ReasonConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Change company plan"
      description={`Current plan: ${currentPlan}. This is a manual override — there is no billing provider behind this change yet.`}
      confirmLabel="Change plan"
      busy={busy}
      confirmDisabled={plan === currentPlan}
      onConfirm={(reason) => onConfirm(plan, reason)}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">New plan</label>
        <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </ReasonConfirmDialog>
  );
}

function CompanyUsersTab({ companyId }: { companyId: string }) {
  const { data } = useQuery(platformCompanyUsersQuery(companyId, {}));
  return (
    <Card>
      <CardContent className="pt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="capitalize">{u.role}</TableCell>
                <TableCell><PlatformStatusBadge status={u.accountStatus} /></TableCell>
                <TableCell className="text-muted-foreground">{dayjs(u.createdAt).format("D MMM YYYY")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CompanyUsageTab({ companyId }: { companyId: string }) {
  const { data: usage } = useQuery(platformCompanyUsageQuery(companyId));
  if (!usage) return null;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card><CardContent className="pt-4">
        <p className="text-lg font-semibold text-foreground">
          {usage.workerSeats.active} / {usage.workerSeats.unlimited ? "∞" : usage.workerSeats.limit}
        </p>
        <p className="text-xs text-muted-foreground">Worker seats</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-lg font-semibold text-foreground">{usage.jobsThisMonth}</p>
        <p className="text-xs text-muted-foreground">Jobs this month</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-lg font-semibold text-foreground">{usage.quotesThisMonth}</p>
        <p className="text-xs text-muted-foreground">Quotes this month</p>
      </CardContent></Card>
      <Card><CardContent className="pt-4">
        <p className="text-lg font-semibold text-foreground">{usage.invoicesThisMonth}</p>
        <p className="text-xs text-muted-foreground">Invoices this month</p>
      </CardContent></Card>
    </div>
  );
}

function CompanyEmailTab({
  companyId,
  onRetry,
  retrying,
  onReset,
}: {
  companyId: string;
  onRetry: () => void;
  retrying: boolean;
  onReset: () => void;
}) {
  const { data: settings } = useQuery(platformCompanyEmailQuery(companyId));
  if (!settings) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Email Sending</CardTitle></CardHeader>
      <CardContent>
        <InfoRow label="Sending mode" value={settings.provider === "custom" ? "Custom domain" : "INPRN default"} />
        <InfoRow label="Sending domain" value={settings.sendingDomain || "—"} />
        <InfoRow label="Domain status" value={<PlatformStatusBadge status={settings.domainStatus} />} />
        <InfoRow label="Sender email" value={settings.senderEmail || "—"} />
        <InfoRow label="Reply-to" value={settings.replyToEmail || "—"} />
        <InfoRow
          label="Last verification"
          value={settings.lastVerificationCheckAt ? dayjs(settings.lastVerificationCheckAt).format("D MMM YYYY, HH:mm") : "Never"}
        />

        {settings.provider === "custom" && (
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>
              {retrying ? "Checking…" : "Retry verification"}
            </Button>
            <Button variant="destructive" size="sm" onClick={onReset}>
              Reset domain
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CompanyActivityTab({ companyId }: { companyId: string }) {
  const { data } = useQuery(platformAuditQuery({ company: companyId }));
  return (
    <Card>
      <CardContent className="pt-4">
        {data?.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No audit events found for this company.</p>
        ) : (
          <div className="divide-y divide-border">
            {data?.data.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{event.actorEmail}</span> · {event.action}
                  </p>
                  {event.reason && <p className="text-xs text-muted-foreground">{event.reason}</p>}
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{dayjs(event.createdAt).format("D MMM, HH:mm")}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
