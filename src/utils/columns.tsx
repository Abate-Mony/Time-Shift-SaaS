import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Clock, MapPin, MoreHorizontal, Users } from "lucide-react"
import { Link } from "react-router"

import type { CreateJobForm, Invoice } from "./types"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import customFetch from "./customFetch"
import { queryClient } from "@/lib/queryClient"
import toast from "react-hot-toast"
import { AnimatedTooltip } from "@/components/ui/animated-tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "./format"
import { formatDate, formatDuration } from "./date"
import { deleteJob, duplicateJob } from "./api-request-functions"
import { useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  published: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

function StatusPill({ value }: { value: string }) {
  const key = value?.toLowerCase() ?? ""
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600"
        }`}
    >
      {value || "draft"}
    </span>
  )
}

function PriorityPill({ value }: { value: string }) {
  const key = value?.toLowerCase() ?? ""
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${PRIORITY_STYLES[key] ?? "bg-slate-100 text-slate-700"
        }`}
    >
      {key === "urgent" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {value || "low"}
    </span>
  )
}

export const jobsColumns: ColumnDef<CreateJobForm>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
  },


  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent font-semibold text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Job
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => {
      const { title, client } = row.original
      return (
        <div className="min-w-45">
          <p className="font-medium text-slate-900 line-clamp-1 max-w-sm">{title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{client}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.original.location
      return (
        <div className="flex items-center gap-1.5 min-w-37.5 text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-sm truncate">{location?.split(",")[0]}</span>
        </div>
      )
    },
  },

  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent font-semibold text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Schedule
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => {
      const { date, startTime, endTime, minutes } = row.original
      // start=2026-08-22&end=2026-08-22&view=day
      return (
        <Link to={`/calendar?start=${dayjs(date).format("YYYY-MM-DD")}&end=${dayjs(date).format("YYYY-MM-DD")}&view=day`} className="min-w-32.5 cursor-pointer block" >
          <p className="text-sm font-medium text-slate-800">
            {formatDate(date, "dd MMMM")}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <Clock className="h-3 w-3" />
            {startTime} – {endTime}
          </div>
          <p className="text-[0.6rem] hidden tracking-wide text-blue-700/60 italic">
            <span className="font-semibold">
              {formatDuration(minutes)} shift
            </span>
          </p>
        </Link>
      )
    },
  },

  {
    accessorKey: "workers",
    header: "Workers",
    enableSorting: false,
    cell: ({ row }) => {
      const workers = row.original.workers

      if (!workers?.length) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
            <Users className="h-3 w-3" />
            Unassigned
          </span>
        )
      }
      // console.log("workers : ", workers.slice(0, 5))

      return (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {/* {JSON.stringify(workers)} */}
            <AnimatedTooltip
              items={workers?.slice(0, 3)?.map((w, idx) => ({
                id: idx,
                designation: w.email || "no email",
                image: "",
                name: w.fullname || "debug later",
              }))}
            />
            {workers.length > 3 && (
              <div className="flex z-10 relative size-9 items-center justify-center rounded-full bg-slate-100 border-2 border-white text-[10px] font-bold text-slate-600">
                +{workers.length - 3}
              </div>
            )}
          </div>
        </div>
      )
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusPill value={getValue() as string} />,
  },

  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ getValue }) => <PriorityPill value={getValue() as string} />,
  },

  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const job = row.original
      const duplicateJobMutation = useMutation({
        mutationFn: duplicateJob,

        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["jobs"],
          });

          toast.success("Job duplicated successfully");
        },

        onError: (error) => {
          console.error(error);

          toast.error("Failed to duplicate job");
        },
      });
      //deletejob

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link to={`/jobs/${job._id}`}>View Details</Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to={`/jobs/${job._id}/edit`}>Edit Job</Link>
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Button
                disabled={duplicateJobMutation.isPending}
                onClick={() => duplicateJobMutation.mutate(job._id!)}
              >
                {duplicateJobMutation.isPending
                  ? "Duplicating..."
                  : "Duplicate"}
              </Button>

            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={()=>deleteJob(job!._id as string)}>
              Delete Job
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-600",
}

function InvoiceStatusPill({ value }: { value: string }) {
  const key = value?.toLowerCase() ?? ""
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${INVOICE_STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600"
        }`}
    >
      {value || "draft"}
    </span>
  )
}

export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoiceNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent font-semibold text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Invoice
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => (
      <Link to={`/invoices/${row.original._id}`} className="font-medium text-slate-900 hover:underline">
        {row.original.invoiceNumber}
      </Link>
    ),
  },

  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => <span className="text-sm text-slate-700">{row.original.client}</span>,
  },

  {
    accessorKey: "issueDate",
    header: "Issue Date",
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{formatDate(row.original.issueDate, "dd MMMM yyyy")}</span>
    ),
  },

  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => (
      <span className="text-sm text-slate-600">{formatDate(row.original.dueDate, "dd MMMM yyyy")}</span>
    ),
  },

  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 hover:bg-transparent font-semibold text-slate-600"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total
        <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-sm font-semibold text-slate-900">{formatCurrency(row.original.total)}</span>,
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <InvoiceStatusPill value={getValue() as string} />,
  },

  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem asChild>
            <Link to={`/invoices/${row.original._id}`}>View Invoice</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]