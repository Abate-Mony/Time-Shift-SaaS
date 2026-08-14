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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog.js";

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
import { Trash2, User } from 'lucide-react';
import { Link } from 'react-router';
import { EmptyState } from './empty-state.js';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    onDeleteSelected?: (rows: TData[]) => Promise<void> | void
}


export default function DataTable<TData, TValue>({
    columns,
    data,
    onDeleteSelected,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [rowSelection, setRowSelection] = React.useState({})
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [isDeleting, setIsDeleting] = React.useState(false)
    const table = useReactTable({
        data,
        columns,
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

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length

    const handleDeleteSelected = async () => {
        if (!onDeleteSelected) return
        try {
            setIsDeleting(true)
            await onDeleteSelected(selectedRows.map((row) => row.original))
            setRowSelection({})
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="rounded-md">
            {selectedCount > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 mb-3">
                    <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{selectedCount}</span>{" "}
                        {selectedCount === 1 ? "row" : "rows"} selected
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>
                            Clear
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={!onDeleteSelected || isDeleting}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        Delete {selectedCount} {selectedCount === 1 ? "job" : "jobs"}?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the selected {selectedCount === 1 ? "job" : "jobs"}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        disabled={isDeleting}
                                        onClick={handleDeleteSelected}
                                    >
                                        {isDeleting ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
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
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                 
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="border-t px-5  border-slate-200 py-3"
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
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
