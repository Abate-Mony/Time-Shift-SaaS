import type z from "zod";
import type { createJobSchema, editProfileSchema, invoiceLineItemSchema, invoiceSchema, Worker } from "./schemas";
import type { ClientAddress, ClientContact, ClientStatus, ChargeType } from "./types/client";

// A job/assignment's billable-unit state — fixed-price jobs track this on
// the Job itself, hourly jobs track it per JobAssignment instead (see the
// backend note on Job.billingStatus for why they're split).
export type BillingStatus = "not_billable" | "pending" | "ready" | "invoiced";

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
export type CreateJobForm = Omit<z.infer<typeof createJobSchema>, "client" | "workers"> & {
  // Overrides the schema's plain-string form value — see JobClientRef above.
  client?: JobClientRef | null;
  // billingStatus/invoice aren't form fields — they're read-only state the
  // API attaches to a saved job/assignment once invoicing has touched it.
  workers: (Worker & { billingStatus?: BillingStatus; invoice?: string | null })[];
  billingStatus?: BillingStatus;
  invoice?: string | null;
};
// Payload shape sent to the API (post-transform: no empty-string gender).
export type EditProfileForm = z.output<typeof editProfileSchema>;
// Shape react-hook-form works with (pre-transform: gender can be "" from the placeholder option).
export type EditProfileFormInput = z.input<typeof editProfileSchema>;

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type InvoiceForm = z.infer<typeof invoiceSchema>;
export type InvoiceStatus = NonNullable<InvoiceForm["status"]>;

// A line item as the server actually returns it — richer than the manual
// form's {description, hours, rate}: `type` distinguishes fixed line items
// (no meaningful "hours") from hourly ones, and job/assignment trace back
// to the source work. date/startTime/endTime/location are a snapshot taken
// at invoice creation — absent on adjustment lines and on legacy items
// created before this shape existed (those render as a generic charge).
export type InvoiceLineItemDisplay = InvoiceLineItem & {
  type?: "hourly" | "fixed" | "adjustment";
  quantity?: number;
  amount?: number;
  job?: string | null;
  assignment?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  workerName?: string | null;
};

export interface ClientSnapshot {
  name: string;
  billingEmail?: string;
  vatNumber?: string;
  phone?: string;
  contactName?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    county?: string;
    postcode?: string;
    country?: string;
  };
}

// Server-side invoice: the form payload plus computed/derived fields.
export type Invoice = Omit<InvoiceForm, "lineItems"> & {
  _id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItemDisplay[];
  // Present on invoices created from the eligible-work flow — absent (or
  // empty) on ones from the older single-job manual form.
  jobs?: string[];
  assignments?: string[];
  clientSnapshot?: ClientSnapshot;
  servicePeriod?: { start: string; end: string };
  vatRate?: number;
  vatAmount?: number;
  amountPaid?: number;
  purchaseOrderNumber?: string;
  paymentReference?: string;
  paymentMethod?: "bank_transfer" | "card" | "cash" | "direct_debit" | "other";
  paymentNotes?: string;
  cancellationReason?: string;
};

export type BillingFrequency = "per_job" | "weekly" | "fortnightly" | "monthly" | "manual";

export interface EligibleWorkItem {
  jobId: string;
  assignmentId?: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  chargeType: "hourly" | "fixed";
  workerName?: string;
  approvedMinutes?: number;
  quantity: number;
  rate: number;
  amount: number;
}

// A completed shift held out of `items` because its overtime hasn't been
// reviewed yet — no safe "approved" figure exists to bill until then.
export interface PendingReviewItem {
  jobId: string;
  assignmentId: string;
  title: string;
  date: string;
  workerName: string;
  reason: "overtime_pending";
}

export interface EligibleWorkResponse {
  success: boolean;
  client: {
    _id: string;
    name: string;
    defaultChargeType: "hourly" | "fixed";
    defaultChargeRate: number;
    paymentTermsDays: number;
    billingEmail?: string;
  };
  period: { start: string; end: string };
  items: EligibleWorkItem[];
  pendingReview: PendingReviewItem[];
  summary: { jobs: number; assignments: number; totalMinutes: number; subtotal: number };
}

// Mirrors the server's PLAN_LIMITS shape (src/utils/constant.ts) — the
// server is the source of truth for what each tier actually gets; this is
// only the wire shape of GET/PATCH /companies/plan's response.
export type CompanyPlanId = "free" | "starter" | "professional" | "enterprise";

export interface PlanLimits {
  maxWorkers: number; // -1 = unlimited
  maxJobsPerMonth: number; // -1 = unlimited
  features: {
    gpsVerification: boolean;
    recurringJobs: boolean;
    openShifts: boolean;
    advancedReports: boolean;
  };
}

export interface CompanyPlanInfo {
  success: boolean;
  plan: CompanyPlanId;
  maxWorkers: number;
  limits: PlanLimits;
}

// GET /companies/plans — the pricing-page catalog for all four tiers.
// Every number/feature bullet here is composed server-side from the same
// PLAN_LIMITS that actually gets enforced, so this can't drift from what a
// company can really do the way a hand-maintained frontend copy already did
// once. Only `name`/`tagline`/pricing/`ctaLabel`/`highlighted` are pure
// marketing copy with no enforcement meaning.
export interface PlanCatalogEntry {
  id: CompanyPlanId;
  name: string;
  tagline: string;
  monthlyPrice: number | null; // null = custom/contact sales
  annualPrice: number | null;
  annualMonthly: number | null;
  ctaLabel: string;
  highlighted: boolean;
  features: string[];
  notIncluded?: string[];
}

export interface PlanCatalogResponse {
  success: boolean;
  plans: PlanCatalogEntry[];
}

export interface BillingPeriodRange {
  start: string;
  end: string;
}

// Powers the "Billing schedule" panel on the create-invoice page — the
// client's cadence, the period currently open for it (null for
// per_job/manual clients, which have no fixed grouping window), and what
// the last real invoice covered.
export interface ClientBillingInfo {
  success: boolean;
  billingFrequency?: BillingFrequency;
  billingDayOfWeek?: number;
  billingDayOfMonth?: number;
  paymentTermsDays: number;
  currentPeriod: BillingPeriodRange | null;
  lastInvoice: { invoiceNumber: string; issueDate: string; servicePeriod?: BillingPeriodRange } | null;
}

export interface InvoiceAdjustmentInput {
  description: string;
  type: "charge" | "discount";
  amount: number;
}

// Live-joined onto GET /invoices/:id, not stored on the Invoice itself —
// see the backend note on why company details aren't snapshotted the way
// clientSnapshot is.
export interface InvoiceCompanyInfo {
  name: string;
  phone?: string;
  country?: string;
  website?: string;
}
export type GeofenceMode = "off" | "warn" | "enforce";
export type Currency = "GBP" | "USD" | "EUR";
export type WeekStartsOn = "monday" | "sunday";

// Company-wide policy — durations are stored as integer minutes throughout.
export interface CompanySettings {
  clockInGraceMinutes?: number;
  lateThresholdMinutes: number;
  // How many minutes past the scheduled end a clock-out can run before it's
  // flagged for manager review (see workerController's overtime check on
  // clock-out) — separate from lateThresholdMinutes, which flags a late
  // clock-IN instead.
  lateClockOutThresholdMinutes?: number;
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
  "assignment_claimed",
  "assignment_claim_approved",
  "assignment_claim_declined",
  "assignment_accepted",
  "assignment_declined",
  "assignment_checked_in",
  "assignment_checked_out",
  "assignment_completed",
  "assignment_cancelled",
  "assignment_in_progress",
  "assignment_overtime_flagged",
  "assignment_overtime_reviewed",
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
