import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Info, OctagonAlert, X } from "lucide-react";
import { getActiveAnnouncements, type ActiveAnnouncement } from "@/utils/api-request-functions";

const SEVERITY_RANK: Record<ActiveAnnouncement["severity"], number> = { critical: 3, warning: 2, info: 1 };

const SEVERITY_STYLE: Record<ActiveAnnouncement["severity"], { bg: string; icon: typeof Info }> = {
  info: { bg: "bg-blue-600", icon: Info },
  warning: { bg: "bg-amber-600", icon: AlertTriangle },
  critical: { bg: "bg-red-600", icon: OctagonAlert },
};

const DISMISSED_KEY = "onclockly:dismissed-announcements";

function getDismissedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  try {
    const ids = getDismissedIds();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids, id]));
  } catch {
    // Browser storage unavailable (private mode, blocked, etc.) — the
    // banner will just reappear next load. Not worth failing over.
  }
}

// Platform-admin-pushed messages (maintenance windows, incidents) — see
// PlatformAnnouncements.tsx for where these are created. Shown one at a
// time, most severe first; dismissing persists per-browser via
// localStorage, not server-side, so it reappears for a different
// account/device (by design — see the implementation plan's verification
// step for this).
export function AnnouncementBanner() {
  const { data } = useQuery({ queryKey: ["announcements", "active"], queryFn: getActiveAnnouncements, staleTime: 5 * 60_000 });
  const [dismissedIds, setDismissedIds] = useState<string[]>(getDismissedIds);

  useEffect(() => {
    setDismissedIds(getDismissedIds());
  }, [data]);

  const visible = (data ?? [])
    .filter((a) => !dismissedIds.includes(a.id))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  const announcement = visible[0];
  if (!announcement) return null;

  const { bg, icon: Icon } = SEVERITY_STYLE[announcement.severity];

  return (
    <div className={`${bg} text-white px-4 py-2 flex items-center gap-2.5 text-sm shrink-0`}>
      <Icon size={15} className="shrink-0" />
      <p className="flex-1 min-w-0">{announcement.message}</p>
      <button
        onClick={() => {
          dismiss(announcement.id);
          setDismissedIds((prev) => [...prev, announcement.id]);
        }}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/15 transition-colors shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}
