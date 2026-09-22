import { useState } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import dayjs from "dayjs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { platformAuditQuery, platformAuditDetailQuery } from "@/utils/platform-api";

export const platformAuditLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformAuditQuery(params));
  return { searchValues: params };
};

function AuditDetailDialog({ eventId, onOpenChange }: { eventId: string | null; onOpenChange: (open: boolean) => void }) {
  const { data: event } = useQuery({
    ...platformAuditDetailQuery(eventId ?? ""),
    enabled: eventId !== null,
  });

  return (
    <Dialog open={eventId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{event?.action ?? "Audit event"}</DialogTitle>
        </DialogHeader>
        {event && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-muted-foreground">Actor</p><p className="font-medium">{event.actorEmail}</p></div>
              <div><p className="text-xs text-muted-foreground">Actor role</p><p className="font-medium capitalize">{event.actorPlatformRole.replace("_", " ")}</p></div>
              <div><p className="text-xs text-muted-foreground">Target</p><p className="font-medium">{event.targetType} · {event.targetId}</p></div>
              <div><p className="text-xs text-muted-foreground">Result</p><PlatformStatusBadge status={event.result} /></div>
              <div><p className="text-xs text-muted-foreground">Timestamp</p><p className="font-medium">{dayjs(event.createdAt).format("D MMM YYYY, HH:mm:ss")}</p></div>
              <div><p className="text-xs text-muted-foreground">Source IP</p><p className="font-medium">{event.source?.ip ?? "—"}</p></div>
            </div>
            {event.reason && (
              <div><p className="text-xs text-muted-foreground">Reason</p><p className="font-medium">{event.reason}</p></div>
            )}
            {(event.before != null || event.after != null) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Before</p>
                  <pre className="mt-1 overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(event.before, null, 2)}</pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">After</p>
                  <pre className="mt-1 overflow-auto rounded-md bg-muted p-2 text-xs">{JSON.stringify(event.after, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PlatformAudit() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const { data } = useQuery(platformAuditQuery(searchValues));
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/audit?${params.toString()}`);
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Audit Logs</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Every platform-admin action, immutable and traceable.</p>
      </div>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No audit events found.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((event) => (
              <TableRow key={event.id} className="cursor-pointer" onClick={() => setSelectedEvent(event.id)}>
                <TableCell className="text-muted-foreground">{dayjs(event.createdAt).format("D MMM, HH:mm")}</TableCell>
                <TableCell className="font-medium text-foreground">{event.actorEmail}</TableCell>
                <TableCell><code className="text-xs">{event.action}</code></TableCell>
                <TableCell className="text-muted-foreground">{event.targetType} · {event.targetId}</TableCell>
                <TableCell><PlatformStatusBadge status={event.result} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.pagination.page <= 1} onClick={() => goToPage(data.pagination.page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => goToPage(data.pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AuditDetailDialog eventId={selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)} />
    </div>
  );
}
