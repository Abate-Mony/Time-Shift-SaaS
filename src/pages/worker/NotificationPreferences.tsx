import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type UpdateNotificationPreferencesPayload,
} from "@/utils/api-request-functions";
import type {
  EventNotificationPreference,
  NotificationChannel,
  NotificationEvent,
  NotificationPreferences,
} from "@/utils/types";
import { useMutation, useQuery, type QueryClient } from "@tanstack/react-query";
import { Bell, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

function PreferenceRowSkeleton({ switches = 1 }: { switches?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-44" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {Array.from({ length: switches }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export const notificationPreferencesQuery = {
  queryKey: ["notification-preferences"],
  queryFn: getNotificationPreferences,
};

export const loader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(notificationPreferencesQuery);
  return null;
};

// Worker-facing events only — things that happen TO this worker. Events
// like job_accepted/job_declined/worker_checked_in/worker_late/
// worker_checked_out/geofence_warning/timesheet_submitted describe a
// worker's action being observed and are manager/admin-facing (they belong
// on an admin notification-preferences screen, not here).
const SECTIONS: {
  title: string;
  rows: {
    event: NotificationEvent;
    label: string;
    description: string;
  }[];
}[] = [
  {
    title: "Jobs",
    rows: [
      {
        event: "job_assigned",
        label: "New job assigned",
        description: "When a manager assigns you a shift",
      },
    ],
  },
  {
    title: "Timesheets",
    rows: [
      {
        event: "timesheet_approved",
        label: "Timesheet approved",
        description: "When your timesheet is approved",
      },
      {
        event: "timesheet_rejected",
        label: "Timesheet rejected",
        description: "When your timesheet is rejected",
      },
    ],
  },
];

function ChannelSwitch({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-medium text-muted-foreground">
        {label}
      </span>

      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0 data-[state=checked]:bg-[var(--primary)]"
      />
    </div>
  );
}

export default function NotificationPreferencesScreen() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(notificationPreferencesQuery);
  const prefs = data?.preferences;

  // Optimistic update: flips the switch immediately, snaps back to
  // whatever was cached if the save fails (updateNotificationPreferences
  // already toasts the error — this only needs to handle the rollback).
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateNotificationPreferencesPayload) =>
      updateNotificationPreferences(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: notificationPreferencesQuery.queryKey });
      const previous = queryClient.getQueryData<{ preferences: NotificationPreferences }>(
        notificationPreferencesQuery.queryKey
      );

      queryClient.setQueryData(
        notificationPreferencesQuery.queryKey,
        (current: { preferences: NotificationPreferences } | undefined) => {
          if (!current) return current;
          return {
            ...current,
            preferences: {
              ...current.preferences,
              ...payload,
              events: payload.events
                ? {
                    ...current.preferences.events,
                    ...Object.fromEntries(
                      Object.entries(payload.events).map(([event, channels]) => [
                        event,
                        { ...current.preferences.events[event as NotificationEvent], ...channels },
                      ])
                    ),
                  }
                : current.preferences.events,
            },
          };
        }
      );

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationPreferencesQuery.queryKey, context.previous);
      }
    },
  });

  const setMasterPreference = (
    key: "emailEnabled" | "pushEnabled" | "inAppEnabled",
    value: boolean
  ) => updateMutation.mutate({ [key]: value });

  const setEventPreference = (
    event: NotificationEvent,
    channel: NotificationChannel,
    value: boolean
  ) => updateMutation.mutate({ events: { [event]: { [channel]: value } } });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-4 animate-fade-in">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="bg-card rounded-2xl border border-[var(--border)] px-5 shadow-sm">
          <div className="py-3.5 border-b border-[var(--border)]">
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <PreferenceRowSkeleton key={i} />
            ))}
          </div>
        </div>
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-card rounded-2xl border border-[var(--border)] px-5 shadow-sm">
            <div className="py-3.5 border-b border-[var(--border)]">
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="divide-y divide-border">
              {section.rows.map((_, i) => (
                <PreferenceRowSkeleton key={i} switches={3} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="py-10 text-sm text-red-500">
        Unable to load notification preferences.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
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
            <Bell
              size={15}
              className="text-muted-foreground"
            />
          </span>

          Notification Preferences
        </h2>

        <p className="text-xs text-muted-foreground mt-1">
          Choose what you want to hear about and how
        </p>
      </div>

      {/* Master channels */}

      <div className="bg-card rounded-2xl border border-[var(--border)] px-5 shadow-sm">
        <div className="py-3.5 border-b border-[var(--border)]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Communication channels
          </p>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Email notifications
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive important updates by email
              </p>
            </div>

            <Switch
              checked={prefs.emailEnabled}
              onCheckedChange={(value) =>
                setMasterPreference(
                  "emailEnabled",
                  value
                )
              }
              className="shrink-0 data-[state=checked]:bg-[var(--primary)]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Push notifications
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive browser or device notifications
              </p>
            </div>

            <Switch
              checked={prefs.pushEnabled}
              onCheckedChange={(value) =>
                setMasterPreference(
                  "pushEnabled",
                  value
                )
              }
              className="shrink-0 data-[state=checked]:bg-[var(--primary)]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                In-app notifications
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Show notifications inside the app
              </p>
            </div>

            <Switch
              checked={prefs.inAppEnabled}
              onCheckedChange={(value) =>
                setMasterPreference(
                  "inAppEnabled",
                  value
                )
              }
              className="shrink-0 data-[state=checked]:bg-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Event-specific preferences */}

      {SECTIONS.map((section) => (
        <div
          key={section.title}
          className="bg-card rounded-2xl border border-[var(--border)] px-5 shadow-sm"
        >
          <div className="py-3.5 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {section.title}
            </p>
          </div>

          <div className="divide-y divide-border">
            {section.rows.map((row) => {
              const eventPrefs: EventNotificationPreference =
                prefs.events[row.event];

              return (
                <div
                  key={row.event}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {row.label}
                    </p>

                    <p className="text-xs text-muted-foreground mt-0.5">
                      {row.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    <ChannelSwitch
                      label="Email"
                      checked={eventPrefs.email}
                      disabled={!prefs.emailEnabled}
                      onCheckedChange={(value) =>
                        setEventPreference(
                          row.event,
                          "email",
                          value
                        )
                      }
                    />

                    <ChannelSwitch
                      label="Push"
                      checked={eventPrefs.push}
                      disabled={!prefs.pushEnabled}
                      onCheckedChange={(value) =>
                        setEventPreference(
                          row.event,
                          "push",
                          value
                        )
                      }
                    />

                    <ChannelSwitch
                      label="In-app"
                      checked={eventPrefs.inApp}
                      disabled={!prefs.inAppEnabled}
                      onCheckedChange={(value) =>
                        setEventPreference(
                          row.event,
                          "inApp",
                          value
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}