import type z from "zod";
import type { createJobSchema, editProfileSchema, invoiceLineItemSchema, invoiceSchema } from "./schemas";

export type UserRole = "admin" | "manager" | "worker";

export type NotificationPreferences = {
  jobAssigned: boolean;
  jobCancelled: boolean;
  shiftReminder: boolean;
  scheduleChanged: boolean;
  payment: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
};

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

export const defaultNotificationPreferences: NotificationPreferences = {
  jobAssigned: true,
  jobCancelled: true,
  shiftReminder: true,
  scheduleChanged: true,
  payment: true,
  email: true,
  push: true,
  sms: false,
};
export type CreateJobForm = z.infer<typeof createJobSchema> & {

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
  clockInGraceMinutes: number;
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