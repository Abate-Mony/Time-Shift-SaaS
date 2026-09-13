import { BulkAcceptDialog } from '@/components/BulkAcceptDialog'
import ShiftRow from '@/components/ShiftRow'
import type { AssignmentStatus, WorkerRecurringGroup } from '@/utils/types'
import { AnimatePresence } from 'framer-motion'
import {
    CheckCircle2,
    ChevronRight, MapPin,
    Repeat2
} from 'lucide-react'
import { useState } from 'react'
export function WorkerRecurringReview({
    group: initialGroup,
}: {
    group: WorkerRecurringGroup
}) {
    const onBack = () => {

    }
    const [group, setGroup] = useState(initialGroup)
    const [showDialog, setShowDialog] = useState(false)

    const handleAccepted = (count: number) => {
        setGroup(g => ({
            ...g,
            acceptedCount: g.acceptedCount + count,
            pendingCount: Math.max(0, g.pendingCount - count),
            shifts: g.shifts.map(s => s.status === 'pending' ? { ...s, status: 'accepted' as AssignmentStatus } : s),
        }))
    }

    const pending = group.shifts.filter(s => s.status === 'pending')
    const upcoming = group.shifts.filter(s => ['pending', 'accepted'].includes(s.status))
    const past = group.shifts.filter(s => ['completed', 'cancelled', 'declined'].includes(s.status))

    return (
        <div className="flex flex-col min-h-full pb-6">
            {/* Back */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 self-start"
            >
                <ChevronRight size={15} className="rotate-180" /> My Jobs
            </button>

            {/* Header */}
            <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground leading-snug mb-1">{group.title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-0.5">
                    <Repeat2 size={13} className="text-muted-foreground" />
                    {group.recurrenceLabel} · {group.startTime}–{group.endTime}
                </p>
                {group.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} /> {group.location}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="bg-card border border-[var(--border)] rounded-2xl p-4 mb-4">
                {group.pendingCount > 0 && (
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-50">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold shrink-0">
                            {group.pendingCount}
                        </span>
                        <p className="text-sm font-semibold text-foreground">{group.pendingCount} shifts waiting for your response</p>
                    </div>
                )}
                <div className="flex items-center gap-4 flex-wrap text-xs">
                    <span className="text-muted-foreground"><strong className="text-foreground font-semibold">{group.upcomingCount}</strong> upcoming</span>
                    {group.pendingCount > 0 && <span className="text-amber-600"><strong>{group.pendingCount}</strong> pending</span>}
                    {group.acceptedCount > 0 && <span className="text-emerald-600"><strong>{group.acceptedCount}</strong> accepted</span>}
                    {group.declinedCount > 0 && <span className="text-red-500"><strong>{group.declinedCount}</strong> declined</span>}
                </div>

                {pending.length > 0 && (
                    <button
                        onClick={() => setShowDialog(true)}
                        className="w-full mt-3 h-11 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={14} />
                        Accept all {group.pendingCount} pending
                    </button>
                )}
            </div>

            {/* Upcoming shifts */}
            {upcoming.length > 0 && (
                <div className="bg-card border border-[var(--border)] rounded-2xl overflow-hidden mb-3">
                    <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Upcoming shifts</p>
                    </div>
                    {upcoming.map(s => (
                        <ShiftRow key={s.jobId} shift={s} />
                    ))}
                </div>
            )}

            {/* Past shifts */}
            {past.length > 0 && (
                <div className="bg-card border border-[var(--border)] rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-50">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past shifts</p>
                    </div>
                    {past.map(s => (
                        <ShiftRow key={s.jobId} shift={s} />
                    ))}
                </div>
            )}

            {/* Dialog */}
            <AnimatePresence>
                {showDialog && (
                    <BulkAcceptDialog
                        group={group}
                        onClose={() => setShowDialog(false)}
                        onAccepted={handleAccepted}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}