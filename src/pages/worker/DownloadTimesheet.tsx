import { cn } from "@/lib/utils";
import {
  downloadTimesheet,
  getTimesheetSummary,
  type TimesheetPeriodType,
} from "@/utils/api-request-functions";
import { formatDuration } from "@/utils/date";
import { useMutation, useQuery } from "@tanstack/react-query";
import dayjs, { type Dayjs } from "dayjs";
import { ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { startOfWeek } from "./ScheduleScreen";

const PERIOD_TYPES: { id: TimesheetPeriodType; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "biweekly", label: "Bi-weekly" },
  { id: "monthly", label: "Monthly" },
];

// A fixed Monday anchors every biweekly block to the same 14-day grid, so
// paging forward/back always lands on stable, non-overlapping periods
// instead of drifting depending on which date you started from.
const BIWEEKLY_EPOCH = startOfWeek(dayjs("2024-01-01"));

function getPeriodRange(type: TimesheetPeriodType, anchor: Dayjs): { start: Dayjs; end: Dayjs } {
  if (type === "weekly") {
    const start = startOfWeek(anchor);
    return { start, end: start.add(6, "day") };
  }

  if (type === "biweekly") {
    const weeksSinceEpoch = startOfWeek(anchor).diff(BIWEEKLY_EPOCH, "week");
    const blockIndex = Math.floor(weeksSinceEpoch / 2);
    const start = BIWEEKLY_EPOCH.add(blockIndex * 2, "week");
    return { start, end: start.add(13, "day") };
  }

  return { start: anchor.startOf("month"), end: anchor.endOf("month") };
}

function shiftAnchor(type: TimesheetPeriodType, anchor: Dayjs, direction: 1 | -1): Dayjs {
  if (type === "weekly") return anchor.add(direction * 7, "day");
  if (type === "biweekly") return anchor.add(direction * 14, "day");
  return anchor.add(direction, "month");
}

export default function DownloadTimesheetScreen() {
  const navigate = useNavigate();

  const [periodType, setPeriodType] = useState<TimesheetPeriodType>("weekly");
  const [anchor, setAnchor] = useState(() => dayjs());

  const { start, end } = getPeriodRange(periodType, anchor);
  const startParam = start.format("YYYY-MM-DD");
  const endParam = end.format("YYYY-MM-DD");

  // Don't let a worker page into a period that hasn't happened yet.
  const isCurrentOrFuturePeriod = !end.isBefore(dayjs(), "day");

  const { data, isLoading: summaryLoading } = useQuery({
    queryKey: ["timesheet-summary", periodType, startParam, endParam],

    queryFn: () =>
      getTimesheetSummary({
        period: periodType,
        start: startParam,
        end: endParam,
      }),
  });

  const summary = data?.summary;

  const downloadMutation =
    useMutation({
      mutationFn: () =>
        downloadTimesheet({
          period: periodType,
          start: startParam,
          end: endParam,
        }),
    });

  const selectPeriodType = (type: TimesheetPeriodType) => {
    setPeriodType(type);
    setAnchor(dayjs());
  };

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Download size={15} className="text-slate-500" />
          </span>
          Download Timesheet
        </h2>

        <p className="text-xs text-slate-400 mt-1">
          Choose a period to generate and download
        </p>
      </div>

      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {PERIOD_TYPES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPeriodType(p.id)}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-semibold transition-colors",
              periodType === p.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] px-3 py-3 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(periodType, a, -1))}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-slate-900">
            {start.format("D MMM")} – {end.format("D MMM YYYY")}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {PERIOD_TYPES.find((p) => p.id === periodType)?.label}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(periodType, a, 1))}
          disabled={isCurrentOrFuturePeriod}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] px-5 shadow-sm divide-y divide-[#F8FAFC]">
        <div className="flex items-center justify-between py-3.5">
          <span className="text-sm text-slate-500">Total hours</span>
          <span className="text-sm font-semibold text-slate-900">
            {summaryLoading ? "—" : formatDuration(summary?.totalMinutes)}
          </span>
        </div>

        <div className="flex items-center justify-between py-3.5">
          <span className="text-sm text-slate-500">Shifts</span>
          <span className="text-sm font-semibold text-slate-900">
            {summaryLoading ? "—" : (summary?.shiftsCount ?? 0)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => downloadMutation.mutate()}
        disabled={summaryLoading || downloadMutation.isPending}
        className="w-full h-11 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
      >
        {downloadMutation.isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {downloadMutation.isPending ? "Generating…" : "Download Timesheet"}
      </button>

      {!summaryLoading && summary && !summary.hasData && (
        <p className="text-xs text-center text-slate-400 -mt-2">
          No shifts recorded in this period
        </p>
      )}
    </div>
  );
}
