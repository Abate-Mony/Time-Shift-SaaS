import { FlaskConical } from "lucide-react";

// Shown on platform screens that have no real data source behind them yet
// (no billing provider, no trial tracking, no telemetry, no cross-company
// email aggregation endpoint). The rest of the platform console is strict
// about never fabricating metrics (see PlatformSystem's own comment to that
// effect) — this banner is what keeps that promise here: the UI exists so
// the shape of the screen is agreed on ahead of the backend work, but an
// operator must never mistake these numbers for real platform state.
export function PlatformPreviewBanner({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <FlaskConical size={15} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Preview — mock data.</span> {reason}
      </p>
    </div>
  );
}
