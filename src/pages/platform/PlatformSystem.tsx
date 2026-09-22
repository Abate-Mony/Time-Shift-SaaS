import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { platformSystemQuery } from "@/utils/platform-api";

export const platformSystemLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(platformSystemQuery);
  return null;
};

export function PlatformSystem() {
  const { data: system } = useQuery(platformSystemQuery);
  if (!system) return null;

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">System</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          High-level operational status. No monitoring/metrics infrastructure exists yet, so this reports only what can be checked live.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>API</CardTitle></CardHeader>
          <CardContent><PlatformStatusBadge status={system.api.status} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Database</CardTitle></CardHeader>
          <CardContent><PlatformStatusBadge status={system.database.status} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
