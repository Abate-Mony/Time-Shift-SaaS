import { useQuery, type QueryClient } from "@tanstack/react-query";
import { Link, useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformStatusBadge } from "@/components/platform/PlatformStatusBadge";
import { platformCompaniesQuery } from "@/utils/platform-api";
import { useState } from "react";
import dayjs from "dayjs";

export const platformCompaniesLoader = (queryClient: QueryClient) => async ({ request }: LoaderFunctionArgs) => {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  await queryClient.ensureQueryData(platformCompaniesQuery(params));
  return { searchValues: params };
};

export function PlatformCompanies() {
  const { searchValues } = useLoaderData() as { searchValues: Record<string, string> };
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const { data } = useQuery(platformCompaniesQuery(searchValues));
  const [search, setSearch] = useState(searchValues.search ?? "");

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
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">Companies</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">View and manage all organisations using INPRN.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("search", search || undefined);
          }}
          className="w-64"
        >
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>

        <Select value={searchValues.status ?? "all"} onValueChange={(v) => setParam("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={searchValues.plan ?? "all"} onValueChange={(v) => setParam("plan", v === "all" ? undefined : v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={isLoading ? "opacity-60 transition-opacity" : "transition-opacity"}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Workers</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No companies match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((company) => (
              <TableRow key={company.id} className="cursor-pointer" onClick={() => navigate(`/platform/companies/${company.id}`)}>
                <TableCell className="font-medium text-foreground">
                  <Link to={`/platform/companies/${company.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                    {company.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{company.owner?.email ?? "—"}</TableCell>
                <TableCell className="capitalize">{company.plan}</TableCell>
                <TableCell>
                  {company.workerUsage.active} / {company.workerUsage.unlimited ? "∞" : company.workerUsage.limit}
                </TableCell>
                <TableCell><PlatformStatusBadge status={company.status} /></TableCell>
                <TableCell className="text-muted-foreground">{dayjs(company.createdAt).format("D MMM YYYY")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} companies
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
