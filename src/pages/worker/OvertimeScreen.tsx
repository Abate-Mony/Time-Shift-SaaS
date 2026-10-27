import { getMyOvertime } from "@/utils/api-request-functions";
import { formatDuration } from "@/utils/date";
import type { OvertimeItem, OvertimeStatus } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { AlertCircle, CheckCircle2, ChevronLeft, Clock, Hourglass, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export const loader = async () => null;

const FILTERS: { id: OvertimeStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<OvertimeStatus, { bg: string; text: string; label: string; Icon: typeof Clock }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", label: "Pending", Icon: Hourglass },
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Approved", Icon: CheckCircle2 },
  rejected: { bg: "bg-rose-50", text: "text-rose-700", label: "Rejected", Icon: XCircle },
};

function OvertimeCard({ item }: { item: OvertimeItem }) {
  const statusStyle = STATUS_STYLES[item.overtimeStatus];
  const { Icon } = statusStyle;

  return (
    <div className="bg-card rounded-2xl border border-[var(--border)] p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${statusStyle.bg}`}>
          <Icon size={14} className={statusStyle.text} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{item.job.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dayjs(item.job.date).format("ddd, D MMM YYYY")} · {item.job.location}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
          {statusStyle.label}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)]">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Worked</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{formatDuration(item.actualMinutes)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Overtime</p>
          <p className="text-sm font-bold text-foreground mt-0.5">+{formatDuration(item.overtimeMinutes)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">{item.overtimeStatus === "pending" ? "Pending pay" : "Paid"}</p>
          <p className={`text-sm font-bold mt-0.5 ${item.overtimeStatus === "approved" ? "text-emerald-700" : "text-foreground"}`}>
            {formatDuration(item.overtimeStatus === "pending" ? item.actualMinutes : item.approvedMinutes)}
          </p>
        </div>
      </div>

      {!!item.managerNotes && (
        <div className="bg-muted rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Manager: </span>
            {item.managerNotes}
          </p>
        </div>
      )}

      {!!item.overtimeReviewedAt && (
        <p className="text-[11px] text-muted-foreground/70">
          Reviewed {dayjs(item.overtimeReviewedAt).format("D MMM YYYY, HH:mm")}
        </p>
      )}
    </div>
  );
}

export default function OvertimeScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<OvertimeStatus | "all">("all");

  const { data: items, isLoading, isError, refetch } = useQuery({
    queryKey: ["overtime", "me"],
    queryFn: () => getMyOvertime(),
  });

  const filtered = (items ?? []).filter(i => filter === "all" || i.overtimeStatus === filter);

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in max-w-2xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <Clock size={15} className="text-muted-foreground" />
          </span>
          Overtime
        </h2>
        <p className="text-xs text-muted-foreground mt-1">See what's pending, approved, or declined.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-colors ${
              filter === f.id
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-muted text-muted-foreground border-[var(--border)] hover:bg-muted/70"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertCircle size={20} className="text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">Couldn't load your overtime</p>
          <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-[var(--primary)] mt-1">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Clock size={20} className="text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">
            {filter === "all" ? "No overtime on record yet" : `No ${filter} overtime`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <OvertimeCard key={item.assignmentId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
