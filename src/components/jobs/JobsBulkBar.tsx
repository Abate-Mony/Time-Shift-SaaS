import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Download, Send, Trash2, UserPlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { queryClient } from "@/lib/queryClient"
import customFetch from "@/utils/customFetch"
import { withCustomPayRates } from "@/utils/workerPay"
import { companyWorkersQuery, jobsToCsv, liveWorkers, saveBlob, type JobListItem } from "@/utils/jobsList"
import dayjs from "dayjs"

const errorOf = (e: any) => e?.response?.data?.msg ?? e?.message ?? "Something went wrong"

/** Runs one request per job, then reports how many worked and the first reason any failed. */
async function forEachJob(jobs: JobListItem[], run: (job: JobListItem) => Promise<unknown>) {
  let ok = 0
  const failures: string[] = []
  for (const job of jobs) {
    try { await run(job); ok++ } catch (e) { failures.push(`${job.title}: ${errorOf(e)}`) }
  }
  await queryClient.invalidateQueries({ queryKey: ["jobs"] })
  return { ok, failures }
}

const report = (verb: string, { ok, failures }: { ok: number; failures: string[] }) => {
  if (ok) toast.success(`${verb} ${ok} job${ok === 1 ? "" : "s"}`)
  if (failures.length) toast.error(`${failures.length} couldn't be changed. ${failures[0]}`, { duration: 7000 })
}

export function JobsBulkBar({ selected, onClear }: { selected: JobListItem[]; onClear: () => void }) {
  const [busy, setBusy] = useState<null | "publish" | "assign" | "delete">(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [workerId, setWorkerId] = useState("")
  const { data: workers } = useQuery({ ...companyWorkersQuery, enabled: assignOpen })
  const drafts = selected.filter(j => j.status === "draft")

  const publish = async () => {
    setBusy("publish")
    report("Published", await forEachJob(drafts, j => customFetch.patch(`/jobs/${j._id}`, { status: "published" })))
    setBusy(null)
    onClear()
  }

  const assign = async () => {
    const worker = workers?.find(w => w._id === workerId)
    if (!worker) return
    setBusy("assign")
    // PATCH /jobs/:id replaces the whole roster, so send everyone already
    // on the job (keeping any custom pay rates) plus the new person.
    const result = await forEachJob(selected, j => {
      const current = liveWorkers(j.workers)
      if (current.some(w => w.email === worker.email)) return Promise.resolve()
      return customFetch.patch(`/jobs/${j._id}`, {
        workers: [...withCustomPayRates(current), { email: worker.email, fullname: worker.fullname, worker: worker._id }],
      })
    })
    report(`Added ${worker.fullname} to`, result)
    setBusy(null)
    setAssignOpen(false)
    setWorkerId("")
    onClear()
  }

  const remove = async () => {
    if (!window.confirm(`Delete ${selected.length} job${selected.length === 1 ? "" : "s"}? This can't be undone.`)) return
    setBusy("delete")
    report("Deleted", await forEachJob(selected, j => customFetch.delete(`/jobs/${j._id}`)))
    setBusy(null)
    onClear()
  }

  const exportSelected = () => {
    saveBlob(new Blob([jobsToCsv(selected)], { type: "text/csv;charset=utf-8" }), `jobs-selected-${dayjs().format("YYYY-MM-DD")}.csv`)
  }

  const btn = "h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap"

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)] overflow-x-auto flex items-center gap-2 bg-slate-900 text-white rounded-xl px-3 py-2 shadow-2xl"
        role="toolbar"
        aria-label="Bulk actions"
      >
        <span className="text-sm font-semibold px-1 whitespace-nowrap">{selected.length} selected</span>
        <button
          type="button"
          className={`${btn} bg-white/10 hover:bg-white/20`}
          disabled={!drafts.length || !!busy}
          title={drafts.length ? `Publishes the ${drafts.length} draft${drafts.length === 1 ? "" : "s"} selected` : "None of the selected jobs are drafts"}
          onClick={publish}
        >
          <Send size={12} /> {busy === "publish" ? "Publishing…" : `Publish${drafts.length && drafts.length !== selected.length ? ` ${drafts.length}` : ""}`}
        </button>
        <button type="button" className={`${btn} bg-white/10 hover:bg-white/20`} disabled={!!busy} onClick={() => setAssignOpen(true)}>
          <UserPlus size={12} /> Assign worker
        </button>
        <button type="button" className={`${btn} bg-white/10 hover:bg-white/20`} disabled={!!busy} onClick={exportSelected}>
          <Download size={12} /> Export
        </button>
        <button type="button" className={`${btn} bg-red-700 hover:bg-red-600`} disabled={!!busy} onClick={remove}>
          <Trash2 size={12} /> {busy === "delete" ? "Deleting…" : "Delete"}
        </button>
        <button type="button" aria-label="Clear selection" onClick={onClear} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white">
          <X size={14} />
        </button>
      </motion.div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a worker to {selected.length} job{selected.length === 1 ? "" : "s"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            They're added alongside anyone already on each job and get the usual assignment notification.
            Jobs that have already happened can't be changed and will be skipped.
          </p>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Pick a worker" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {(workers ?? []).map(w => <SelectItem key={w._id} value={w._id}>{w.fullname || w.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <button type="button" onClick={() => setAssignOpen(false)} className="h-9 px-4 rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
            <button
              type="button"
              disabled={!workerId || busy === "assign"}
              onClick={assign}
              className="h-9 px-4 rounded-lg bg-[var(--primary)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy === "assign" ? "Adding…" : "Add worker"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
