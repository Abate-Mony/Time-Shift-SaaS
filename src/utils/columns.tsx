import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDown, Clock, MapPin, MoreHorizontal } from "lucide-react";
import { Link } from "react-router";

import type { CreateJobForm } from "./types";

import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui";
import customFetch from "./customFetch";
import { queryClient } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

export const jobsColumns: ColumnDef<CreateJobForm>[] = [
    {
        id: "index",
        header: "#",
        enableSorting: false,
        cell: ({ row }) => (
            <span className="text-sm font-medium text-slate-500  h-full ">
                {row.index < 10 ? "0" + (row.index + 1) : row.index}
            </span>
        ),
    },

    {
        accessorKey: "title",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="px-0 hover:bg-transparent"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Job
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { title, company } = row.original;

            return (
                <div className="min-w-[180px] ">
                    <p className="font-medium text-slate-900 truncate line-clamp-2 max-w-sm">{title}</p>
                    <p className="text-xs text-slate-500">{company}</p>
                </div>
            );
        },
    },

    {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => {
            const location = row.original.location;

            return (
                <div className="flex items-center gap-2 min-w-37.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600 truncate">
                        {location?.split(",")[0]}
                    </span>
                </div>
            );
        },
    },

    {
        accessorKey: "date",
        header: ({ column }) => (
            <Button
                variant="ghost"
                className="px-0 hover:bg-transparent"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Schedule
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const { date, startTime, endTime } = row.original;

            return (
                <div className="min-w-[130px]">
                    <p className="text-sm font-medium">
                        {format(new Date(date), "dd MMM")}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="h-3 w-3" />
                        {startTime} – {endTime}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: "workers",
        header: "Workers",
        enableSorting: false,
        cell: ({ row }) => {
            const workers = row.original.workers;
            console.log(row.original.workers)
            if (!workers.length) {
                return (
                    <span className="text-xs font-medium text-red-500">
                        Unassigned
                    </span>
                );
            }

            return (
                <div className="flex items-center">
                    <div className="flex -space-x-2">
                        <AnimatedTooltip
                            items={workers.map((w,idx )=> ({
                                id:idx,
                                designation:w.email,
                                image:"",
                                name:w.fullname
                        }))}
                        />
                        {/* {workers.slice(0, 3).map((worker, index) => (
                            // <div
                            //     key={worker?.fullname}
                            //     className="rounded-full ring-2 ring-white"
                            // >
                            //     <Avatar
                            //         initials={worker?.fullname?.slice(0, 2)}
                            //         size="sm"
                            //         index={index}
                            //     />
                            // </div>
                        ))} */}

                        {workers.length > 3 && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
                                +{workers.length - 3}
                            </div>
                        )}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium capitalize text-blue-700">
                {String(getValue()) ?? "assigned"}
            </span>
        ),
    },

    {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ getValue }) => {
            const priority = String(getValue());

            const colours: Record<string, string> = {
                low: "bg-green-100 text-green-700",
                medium: "bg-yellow-100 text-yellow-700",
                high: "bg-orange-100 text-orange-700",
                urgent: "bg-red-100 text-red-700",
            };

            return (
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${colours[priority.toLowerCase()] ??
                        "bg-slate-100 text-slate-700"
                        }`}
                >
                    {priority || "low"}
                </span>
            );
        },
    },

    {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
            const job = row.original;
            const deleteJob = async () => {
                try {
                    await customFetch.delete(`/jobs/${job._id}`)
                    queryClient.invalidateQueries({ queryKey: ["jobs"] })
                    toast.success("job deleted successfully")
                } catch (e) {
                    toast.error("fail to delete job , try again later ")
                }
            }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={`/jobs/${job._id}`}>
                                View Details
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                            <Link to={`/jobs/${job._id}/edit`}>
                                Edit Job
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem>
                            Duplicate
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="text-red-600"
                            onClick={deleteJob}
                        >
                            Delete Job
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];