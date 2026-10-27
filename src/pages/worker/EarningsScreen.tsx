import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getMyEarnings } from "@/utils/api-request-functions";
import { formatDate, formatDuration } from "@/utils/date";
import type { EarningsPeriod, EarningsResponse, EarningsShift } from "@/utils/types";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Wallet } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const money = (n: number) => `£${n.toFixed(2)}`;

function periodLabel(period: EarningsResponse["period"]) {
  const start = dayjs(period.start);
  const end = dayjs(period.end);
  if (period.type === "month") {
    return period.offset === 0 ? "This month" : start.format("MMMM YYYY");
  }
  if (period.offset === 0) return "This week";
  if (period.offset === -1) return "Last week";
  return `${start.format("D MMM")} – ${end.format("D MMM")}`;
}

export default function EarningsScreen() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<EarningsPeriod>("week");
  const [offset, setOffset] = useState(0);

  const { data, isLoading, isError, refetch, isPlaceholderData } = useQuery({
    queryKey: ["earnings", period, offset],
    queryFn: () => getMyEarnings({ period, offset }),
    placeholderData: keepPreviousData,
  });

  const switchPeriod = (next: EarningsPeriod) => {
    setPeriod(next);
    setOffset(0);
  };

  const renderShift = (s: EarningsShift) => (
    <button
      type="button"
      key={s.assignmentId}
      onClick={() => navigate(`/worker/jobs/${s.job._id}`)}
      className="w-full flex items-center gap-3 px-3.5 py-3 border-b border-[var(--border)] last:border-b-0 hover:bg-muted transition-colors text-left"
    >
      <div className="w-9 flex flex-col items-center shrink-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">
          {formatDate(s.job.date, "ddd")}
        </span>
        <span className="text-lg font-extrabold text-foreground">{formatDate(s.job.date, "D")}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{s.job.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {s.job.startTime}–{s.job.endTime} · {formatDuration(s.minutes)} · £{s.payRate}/hr
        </p>
        {s.overtimePendingMinutes > 0 && (
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">
            +{formatDuration(s.overtimePendingMinutes)} overtime awaiting approval
          </p>
        )}
      </div>
      <span className={cn("text-sm font-extrabold shrink-0", s.kind === "upcoming" ? "text-muted-foreground" : "text-foreground")}>
        {money(s.amount)}
      </span>
    </button>
  );

  const earnedShifts = data?.shifts.filter(s => s.kind === "earned") ?? [];
  const upcomingShifts = data?.shifts.filter(s => s.kind === "upcoming") ?? [];

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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Earnings</h2>

        <div className="flex bg-muted rounded-xl p-1 gap-1">
          {(["week", "month"] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => switchPeriod(p)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError || !data ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <AlertCircle size={20} className="text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">Couldn't load earnings</p>
          <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-[var(--primary)] mt-1">
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setOffset(o => o - 1)}
              className="w-8 h-8 rounded-full border border-[var(--border)] bg-card flex items-center justify-center text-[var(--primary)] hover:bg-muted transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-foreground">{periodLabel(data.period)}</p>
            <button
              type="button"
              disabled={offset >= 0}
              onClick={() => setOffset(o => o + 1)}
              className="w-8 h-8 rounded-full border border-[var(--border)] bg-card flex items-center justify-center text-[var(--primary)] hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={cn("bg-[var(--primary)] rounded-2xl p-5", isPlaceholderData && "opacity-50")}>
            <p className="text-[11px] font-bold text-white/55 uppercase tracking-wide">Earned</p>
            <p className="text-3xl font-extrabold text-white mt-1">{money(data.earned.amount)}</p>
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[
                { label: "Worked", value: formatDuration(data.earned.minutes) },
                { label: "Shifts", value: data.earned.shifts },
                { label: "Upcoming", value: money(data.upcoming.amount) },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl py-2.5 text-center">
                  <p className="text-sm font-extrabold text-white">{s.value}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {data.pendingOvertimeAmount > 0 && (
            <button
              type="button"
              onClick={() => navigate("/worker/profile/overtime")}
              className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-3.5 text-left hover:bg-amber-100/60 transition-colors"
            >
              <Clock size={16} className="text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-800">{money(data.pendingOvertimeAmount)} pending approval</p>
                <p className="text-xs text-amber-700/80 mt-0.5">
                  Overtime awaiting your manager's review isn't included in the total above.
                </p>
              </div>
              <ChevronRight size={16} className="text-amber-700 mt-0.5 shrink-0" />
            </button>
          )}

          {data.shifts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Wallet size={20} className="text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">No shifts in this period</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Completed and upcoming shifts will show here with their pay.
              </p>
            </div>
          ) : (
            <div className={cn("flex flex-col gap-4", isPlaceholderData && "opacity-50")}>
              {upcomingShifts.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                    Upcoming · estimated
                  </p>
                  <div className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden">
                    {upcomingShifts.map(renderShift)}
                  </div>
                </div>
              )}
              {earnedShifts.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Completed</p>
                  <div className="bg-card rounded-2xl border border-[var(--border)] overflow-hidden">
                    {earnedShifts.map(renderShift)}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center px-4">
                Amounts are before tax and deductions. Upcoming pay is estimated from scheduled hours.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
