import type z from "zod";
import type { createJobSchema, editProfileSchema, invoiceLineItemSchema, invoiceSchema } from "./schemas";
import type { ClientAddress, ClientContact, ClientStatus, ChargeType } from "./types/client";

// A Job's `client` field: `createJobSchema.client` (below) is the plain
// string _id a form submits, but a job read back from the API carries a
// populated reference — list responses just {_id, name}, detail responses
// the fuller shape. This is the read-side shape.
export interface JobClientRef {
  _id: string;
  name: string;
  status?: ClientStatus;
  contacts?: ClientContact[];
  phone?: string;
  billingEmail?: string;
  address?: ClientAddress;
  defaultChargeType?: ChargeType;
  defaultChargeRate?: number;
}

export type UserRole = "admin" | "manager" | "worker";

// export type NotificationPreferences = {
//   jobAssigned: boolean;
//   jobCancelled: boolean;
//   shiftReminder: boolean;
//   scheduleChanged: boolean;
//   payment: boolean;
//   email: boolean;
//   push: boolean;
//   sms: boolean;
// };

export type User = {
  _id: string;
  email: string;
  fullname: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  gender?: "Male" | "Female" | "Other" | "Prefer not to say"
  password?: string;
  confirmPassword?: string;
  notificationPreferences?: NotificationPreferences;
};

// export const defaultNotificationPreferences: NotificationPreferences = {
//   jobAssigned: true,
//   jobCancelled: true,
//   shiftReminder: true,
//   scheduleChanged: true,
//   payment: true,
//   email: true,
//   push: true,
//   sms: false,
// };
export type CreateJobForm = Omit<z.infer<typeof createJobSchema>, "client"> & {
  // Overrides the schema's plain-string form value — see JobClientRef above.
  client?: JobClientRef | null;
};
// Payload shape sent to the API (post-transform: no empty-string gender).
export type EditProfileForm = z.output<typeof editProfileSchema>;
// Shape react-hook-form works with (pre-transform: gender can be "" from the placeholder option).
export type EditProfileFormInput = z.input<typeof editProfileSchema>;

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceForm = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = NonNullable<InvoiceForm["status"]>;
// Server-side invoice: the form payload plus computed/derived fields.
export type Invoice = InvoiceForm & {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
};
export type GeofenceMode = "off" | "warn" | "enforce";
export type Currency = "GBP" | "USD" | "EUR";
export type WeekStartsOn = "monday" | "sunday";

// Company-wide policy — durations are stored as integer minutes throughout.
export interface CompanySettings {
  clockInGraceMinutes?: number;
  lateThresholdMinutes: number;
  autoClockOutEnabled: boolean;
  payFromScheduledStart: boolean;

  geofenceMode: GeofenceMode;
  defaultGeofenceRadiusMeters: number;

  breaksArePaid: boolean;
  autoDeductBreakMinutes: number;
  autoDeductAfterMinutes: number;

  overtimeThresholdMinutes: number;
  overtimeMultiplier: number;
  weeklyHoursTarget: number;
  currency: Currency;
  defaultPayRate: number;

  timezone: string;
  weekStartsOn: WeekStartsOn;
  generateAheadDays: number;
  openShiftsEnabled: boolean;
  openShiftsRequireApproval: boolean;
}
export type NotificationChannel =
  | "email"
  | "push"
  | "inApp";

export type NotificationEvent =
  | "job_assigned"
  | "job_accepted"
  | "job_declined"
  | "worker_checked_in"
  | "worker_late"
  | "worker_checked_out"
  | "job_completed"
  | "geofence_warning"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "timesheet_rejected";

export type EventNotificationPreference = {
  email: boolean;
  push: boolean;
  inApp: boolean;
};

export interface NotificationPreferences {
  _id?: string;

  user?: string;
  company?: string;

  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;

  events: Record<
    NotificationEvent,
    EventNotificationPreference
  >;
}
export const ACTIVITY_TYPES = [
  "job_created",
  "job_updated",
  "job_published",
  "job_cancelled",
  "workers_assigned",       // batch event — one entry even if multiple workers assigned at once
  "assignment_accepted",
  "assignment_declined",
  "assignment_checked_in",
  "assignment_checked_out",
  "assignment_completed",
  "assignment_cancelled",
  "assignment_in_progress",
  "note_added",
  "job_deleted",
  "job_completed",
  "worker_unassigned",
  "assignment_break_started",
  "assignment_break_ended",
  "assignment_auto_completed"
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type TimesheetPeriodType =
  | "weekly"
  | "biweekly"
  | "monthly";

// NOTE: shape is a best guess — confirm the real field names against a live
// /timesheets/ response and adjust. This describes one shift/job the worker
// worked in the requested period, not a co-worker on a job (which is what
// CreateJobForm["workers"] — the type this replaced — actually describes).
export interface TimesheetAssignment {
  _id?: string;
  title?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  minutes?: number;
}

export interface TimesheetSummaryResponse {
  success: boolean;
  totalMinutes: number;
  shiftsCount: number;
  hasData: boolean;
  totalJobs:number,
  totalHours:number,
  assignments: TimesheetAssignment[]
}

export type AssignmentStatus = 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed' | 'cancelled'

export interface WorkerRecurringShift {
  jobId: string
  assignmentId: string
  date: string
  startTime: string
  endTime: string
  location?: string
  status: AssignmentStatus
}

export interface WorkerRecurringGroup {
  recurringJobId: string
  title: string
  location?: string
  client?: string
  recurrenceLabel: string
  startTime: string
  endTime: string
  pendingCount: number
  acceptedCount: number
  declinedCount: number
  upcomingCount: number
  nextShift?: { jobId: string; assignmentId: string; date: string; startTime: string; endTime: string }
  shifts: WorkerRecurringShift[]
}
export type DialogState = 'confirm' | 'loading' | 'success' | 'partial' | 'error' | 'empty'
