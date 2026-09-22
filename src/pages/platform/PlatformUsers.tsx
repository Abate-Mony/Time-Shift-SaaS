import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { platformUsersQuery } from "@/utils/platform-api";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

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

  const { data } = useQuery(platformUsersQuery(searchValues));
  const [search, setSearch] = useState(searchValues.search ?? "");

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchValues);
    params.set("page", String(page));
    navigate(`/platform/users?${params.toString()}`);
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Search users across every company on INPRN.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams(searchValues);
          if (search) params.set("search", search);
          else params.delete("search");
          params.delete("page");
          navigate(`/platform/users?${params.toString()}`);
        }}
        className="w-72"
      >
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </form>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Platform access</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No users match this search.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((user) => (
              <TableRow key={user.id} className="cursor-pointer" onClick={() => navigate(`/platform/users/${user.id}`)}>
                <TableCell>
                  <p className="font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.company?.name ?? "—"}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                  {user.platformRole ? <Badge className="capitalize">{user.platformRole.replace("_", " ")}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell><PlatformStatusBadge status={user.accountStatus} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} users
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
    </div>
  );
}
