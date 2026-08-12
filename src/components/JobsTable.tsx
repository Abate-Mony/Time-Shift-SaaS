import React from 'react';

import type {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Button } from "./ui/button.js";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "./ui/dropdown-menu.js";

export type Payment = {
    id: string
    amount: number
    status: "pending" | "processing" | "success" | "failed"
    email: string
}


import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { User } from 'lucide-react';
import { EmptyState } from './empty-state.js';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    getRowId: (row: TData) => string;
}

const MotionTableRow = motion.create(TableRow)

export default function DataTable<TData, TValue>({
    columns,
    data,
    getRowId
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const table = useReactTable({
        data,
        columns,
        getRowId,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        enableRowSelection: true,
        state: {
            sorting, columnFilters, columnVisibility, rowSelection,

        },

    })
    return (
        <div className="rounded-md">
            <div className="flex items-center py-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) => column.getCanHide()
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Table
                className='scrollto  border rounded-lg overflow-hidden'
                style={{
                    borderCollapse: 'separate',
                    borderSpacing: '0 0'
                }}
            >
                <TableHeader
                    className='px-5 py-3    text-white! bg-transparent  rounded-full w-full  h-14 '
                >
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className='border'>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}
                                        className='text-black '
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode='popLayout' initial={false}>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <MotionTableRow
                                    key={row.id}
                                    initial={{
                                        opacity: 0.7, x: -10,
                                        y: 10
                                    }}
                                    animate={{
                                        opacity: 1, y: 0, x: 0
                                    }}
                                    exit={{
                                        opacity: 0,
                                        y: -100,
                                    }}
                                    transition={{
                                        duration: 0.35
                                    }}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="border-t px-5  border-slate-200 py-3"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </MotionTableRow>
                            ))
                        ) : (
                            <TableRow key="empty">
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <EmptyState
                                        title='No jobs found'
                                        description="Try adjusting your search or filters to find what you're looking for."
                                        icon={
                                            <User />
                                        }

                                        action={
                                            <Link to={"/create-job?from=jobspage"}>
                                                <Button size={"lg"} variant={"secondary"}>
                                                    create new job
                                                </Button>
                                            </Link>
                                        }

                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </AnimatePresence>
                </TableBody>
            </Table>
            {/* do later  */}
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
            <div className="flex-1 hidden text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>

        </div>
    )
}
