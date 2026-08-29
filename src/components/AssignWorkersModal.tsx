import { Avatar, Input } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { updateJobWorkers } from "@/utils/api-request-functions"
import customFetch from "@/utils/customFetch"
import type { CreateJobForm, User } from "@/utils/types"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, Loader2, Search, Users } from "lucide-react"
import { useMemo, useState } from "react"

type AssignedWorker = CreateJobForm["workers"][number]

export default function AssignWorkersModal({
    jobId,
    assignedWorkers,
    open,
    onOpenChange,
}: {
    jobId: string
    assignedWorkers: AssignedWorker[]
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [search, setSearch] = useState("")
    const [selected, setSelected] = useState<AssignedWorker[]>([])

    const { data, isLoading } = useQuery({
        queryKey: ["all-workers"],
        queryFn: async () => {
            const { data } = await customFetch.get<{ users: User[] }>("/users/users")
            return data
        },
        enabled: open,
    })

    const assignedEmails = useMemo(
        () => new Set(assignedWorkers.map(w => w.email)),
        [assignedWorkers]
    )

    const allWorkers = data?.users ?? []
    // Shown, not filtered out — already-assigned workers stay visible in the
    // list (disabled) so a manager can see who's already on the job, rather
    // than them silently disappearing.
    const visibleWorkers = allWorkers.filter(u =>
        search.trim() === "" || u.fullname.toLowerCase().includes(search.trim().toLowerCase())
    ).filter(u=>u.role=="worker")

    const toggleWorker = (worker: User) => {
        if (assignedEmails.has(worker.email)) return
        setSelected(current =>
            current.some(w => w.email === worker.email)
                ? current.filter(w => w.email !== worker.email)
                : [...current, {
                    user: worker._id,
                    fullname: worker.fullname,
                    email: worker.email,
                    phone: worker.phone ?? "",
                    // Remaining AssignedWorker fields (status, job, createdBy, ...)
                    // are zod-defaulted server-side on save — not this component's
                    // job to guess at.
                } as AssignedWorker]
        )
    }

    const addWorkersMutation = useMutation({
        mutationFn: () =>
            updateJobWorkers(
                jobId,
                [...assignedWorkers, ...selected],
                `${selected.length} worker${selected.length > 1 ? "s" : ""} added`
            ),
        onSuccess: (didSucceed) => {
            // updateJobWorkers already toasted either way — this just decides
            // whether to close/reset on success.
            if (!didSucceed) return
            setSelected([])
            setSearch("")
            onOpenChange(false)
        },
    })

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setSelected([])
            setSearch("")
        }
        onOpenChange(next)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md flex flex-col gap-4">
                <DialogHeader>
                    <DialogTitle>Add Workers</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search workers..."
                        className="pl-9 h-9"
                    />
                </div>

                <div className="max-h-80 overflow-y-auto border border-[#E2E8F0] rounded-xl">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={18} className="animate-spin text-slate-400" />
                        </div>
                    ) : visibleWorkers.length === 0 ? (
                        <div className="py-10 text-center">
                            <Users size={18} className="text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">
                                {allWorkers.length > 0 ? "No workers match your search" : "No workers found"}
                            </p>
                        </div>
                    ) : (
                        visibleWorkers.map((w, i) => {
                            const isAssigned = assignedEmails.has(w.email)
                            const isSelected = selected.some(sw => sw.email === w.email)
                            return (
                                <button
                                    disabled={isAssigned}
                                    type="button"
                                    key={w._id}
                                    onClick={() => toggleWorker(w)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 transition-colors border-b border-[#F1F5F9] last:border-0",
                                        isAssigned ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
                                        isSelected && "bg-blue-50/40"
                                    )}
                                >
                                    <Avatar initials={w.fullname.slice(0, 2)} size="sm" index={i} />
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{w.fullname}</p>
                                        <p className="text-xs text-slate-400">
                                            {isAssigned ? "Already assigned" : w.role}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                        isSelected || isAssigned ? "bg-[#1E3A5F] border-[#1E3A5F]" : "border-slate-300"
                                    )}>
                                        {(isSelected || isAssigned) && <Check size={11} className="text-white" />}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>

                <DialogFooter>
                    <button
                        type="button"
                        onClick={() => addWorkersMutation.mutate()}
                        disabled={selected.length === 0 || addWorkersMutation.isPending}
                        className={cn(
                            "w-full h-11 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed",
                            selected.length > 0
                                ? "bg-[#1E3A5F] text-white hover:bg-[#162D4A] shadow-sm shadow-[#1E3A5F]/25"
                                : "bg-slate-100 text-slate-400"
                        )}
                    >
                        {addWorkersMutation.isPending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Check size={14} />
                        )}
                        {selected.length > 0
                            ? `Add ${selected.length} Worker${selected.length > 1 ? "s" : ""}`
                            : "Select workers to add"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
