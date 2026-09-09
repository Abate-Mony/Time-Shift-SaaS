import { z } from "zod"
const breakSchema = z.object({
    startedAt: z.coerce.date(),
    endedAt: z.coerce.date().optional(),
});
export const workerSchema = z.object({
    // The JobAssignment's own id — not known client-side until the backend
    // returns it, hence optional (mirrors createJobSchema's own `_id`).
    _id: z.string().optional(),

    breaks: z.array(breakSchema).default([]).optional(),

    worker: z.string().min(1, "workter id required"),

    fullname: z
        .string()
        .min(1, "Full name is required"),

    email: z
        .string()
        .email("Invalid email address"),

    phone: z
        .string()
        .default(""),

    // Not known client-side at job-creation time (the job doesn't have an id
    // yet, and createdBy comes from the authenticated session) — the backend
    // fills these in on save, so the client must be allowed to omit them.
    job: z
        .string()
        .optional(),

    createdBy: z
        .string()
        .optional(),

    status: z.enum([
        "pending",
        "accepted",
        "declined",
        "in-progress",
        "completed",
        "cancelled",
    ]).default("pending"),

    // True only for a self-claimed open shift on a job with requiresApproval —
    // status stays "pending" either way, this is what tells the two apart.
    pendingApproval: z.boolean().optional(),

    // Set on clock-out when worked time overran the job's scheduled duration
    // by more than the company's threshold. "pending" means a manager needs
    // to approve/adjust/reject it (see reviewAssignmentOvertime) before the
    // extra time counts toward payroll — approvedMinutes stays capped at the
    // scheduled amount until then.
    actualMinutes: z.number().nullable().optional(),
    approvedMinutes: z.number().nullable().optional(),
    overtimeMinutes: z.number().default(0),
    overtimeStatus: z.enum(["none", "pending", "approved", "rejected"]).default("none"),
    clockOutReason: z.enum([
        "on_time", "job_took_longer", "manager_asked_to_stay", "forgot_to_clock_out", "auto_closed", "other",
    ]).optional(),
    clockOutNote: z.string().optional(),

    acceptedAt: z.date().optional(),

    declinedAt: z.date().optional(),

    checkedInAt: z.date().optional(),

    checkedOutAt: z.date().optional(),

    completedAt: z.date().optional(),

    cancellationReason: z
        .string()
        .default(""),

    workerNotes: z
        .string()
        .default(""),

    managerNotes: z
        .string()
        .default(""),

    hoursWorked: z
        .number()
        .default(0),

    overtimeHours: z
        .number()
        .default(0),

    payRate: z
        .number()
        .default(0),

    totalPay: z
        .number()
        .default(0),

});

export type Worker = z.infer<typeof workerSchema>;
export const createJobSchema = z
    .object({
        _id: z.string().optional(),

        title: z.string().min(3, "Job title is required"),

        description: z.string().min(5, "Description is required"),

        // A real Client _id (or omitted/empty — no client is legitimate,
        // e.g. internal/training work). No longer free text.
        client: z.string().optional(),

        createdBy: z.string().optional(),

        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),

        // CreateJobForm is reused for both the admin's job shape (status:
        // draft/published/completed/cancelled) and the worker-facing
        // /workers responses, where the backend merges the worker's own
        // JobAssignment status onto this same field (pending/accepted/
        // declined/in-progress/completed/cancelled) — so the type has to
        // cover both meanings even though only one applies in any given
        // response.
        status: z
            .enum(["draft", "published", "assigned", "pending", "accepted", "declined", "in-progress", "completed", "cancelled"])
            .optional(),

        date: z.string().min(1, "Date is required"),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
        minutes: z.number().int().min(0).optional(), // server-derived

        location: z.string().min(1, "Location is required"),
        address: z.string().default(""),
        coordinates: z
            .object({
                lat: z.number(),
                lng: z.number(),
            })
            .optional(),
        // Blank via register(..., { valueAsNumber: true }) reads as NaN, not
        // undefined — strip that here rather than at every registration site.
        geofenceRadiusMeters: z.preprocess(
            v => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
            z.number().int().min(25).max(5000).optional()
        ),

        // ── Staffing ──────────────────────────────────────────────────────
        requiredWorkers: z.number().int().min(1, "At least one worker").default(1),

        // Workers may be empty — an unstaffed job is a legitimate open shift
        workers: z.array(workerSchema).default([]),

        // ── Money ─────────────────────────────────────────────────────────
        payRate: z.number().min(0, "Pay rate can't be negative").default(0),
        chargeType: z.enum(["hourly", "fixed"]).default("hourly"),
        chargeRate: z.number().min(0, "Charge rate can't be negative").default(0),
        chargeAmount: z.number().min(0, "Amount can't be negative").default(0),
        // Job.geofenceMode's own DB default is `null` ("inherit the company
        // setting" — see jobModel.ts), not just "absent" — an edit form
        // loading a real job needs to accept that, not only undefined.
        geofenceMode: z.enum(["off", "warn", "enforce"]).nullable().optional(),
        additional_notes: z.string().optional(),

        // ── Advanced options ─────────────────────────────────────────────
        supervisor: z.string().optional(),
        instructions: z.string().optional(),
        notes: z.string().optional(),
        openToClaims: z.boolean().default(false),
        requiresApproval: z.boolean().default(true),
        // Same NaN-from-blank-input issue as geofenceRadiusMeters above.
        clockInGraceMinutes: z.preprocess(
            v => (typeof v === "number" && Number.isNaN(v) ? undefined : v),
            z.number().int().min(0).max(240).optional()
        ),
    })
    .refine(d => d.chargeType !== "fixed" || d.chargeAmount > 0, {
        message: "Enter a price for fixed-price jobs",
        path: ["chargeAmount"],
    })
    .refine(d => d.workers.length <= d.requiredWorkers, {
        message: "You've assigned more workers than this job needs",
        path: ["workers"],
    });

export const editProfileSchema = z.object({
    fullname: z
        .string()
        .min(1, "Full name is required"),

    email: z
        .string()
        .email("Invalid email address"),

    phone: z
        .string()
        .optional(),

    gender: z.union([
        z.enum(["Male", "Female", "Other", "Prefer not to say"]),
        z.literal(""),
    ]).optional().transform(v => v === "" ? undefined : v),
});

export const invoiceLineItemSchema = z.object({
    description: z
        .string()
        .min(1, "Description is required"),

    hours: z
        .number()
        .min(0, "Hours can't be negative"),

    rate: z
        .number()
        .min(0, "Rate can't be negative"),
});

export const invoiceSchema = z.object({
    _id: z
        .string()
        .optional(),

    invoiceNumber: z
        .string()
        .optional(),

    job: z
        .string()
        .min(1, "Job is required"),

    client: z
        .string()
        .min(1, "Client is required"),

    issueDate: z
        .string()
        .min(1, "Issue date is required"),

    dueDate: z
        .string()
        .min(1, "Due date is required"),

    lineItems: z
        .array(invoiceLineItemSchema)
        .min(1, "Add at least one line item"),

    notes: z
        .string()
        .optional(),

    status: z.enum([
        "draft",
        "sent",
        "paid",
        "overdue",
        "cancelled",
    ]).optional(),
});