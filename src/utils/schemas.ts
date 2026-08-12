import { z } from "zod"

export const workerSchema = z.object({
    user: z.string().min(1, "User is required"),

    fullname: z
        .string()
        .min(1, "Full name is required"),

    email: z
        .string()
        .email("Invalid email address"),

    phone: z
        .string()
        .default(""),

    job: z
        .string()
        .min(1, "Job is required"),

    createdBy: z
        .string()
        .min(1, "Created by is required"),

    status: z.enum([
        "pending",
        "accepted",
        "declined",
        "in-progress",
        "completed",
        "cancelled",
    ]).default("pending"),

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
export const createJobSchema = z.object({
    _id: z
        .string().optional(),
    title: z
        .string()
        .min(3, "Job title is required"),

    description: z
        .string()
        .min(5, "Description is required"),

    client: z
        .string()
        .min(2, "Company is required"),
    createdBy: z
        .string()
        .optional(),

    priority: z.enum([
        "low",
        "medium",
        "high",
    ]),
    status: z.enum([
        "draft",
        "published",
        "assigned",
        "accepted",
        "in-progress",
        "completed",
        "cancelled",
        "declined",
        "pending"
    ]).optional(),

    date: z
        .string()
        .min(1, "Date is required"),

    startTime: z
        .string()
        .min(1, "Start time is required"),

    endTime: z
        .string()
        .min(1, "End time is required"),

    workers: z
        .array(workerSchema)
        .min(1, "Please select at least one worker"),

    additional_notes: z
        .string()
        .optional(),
    location: z
        .string()
        .optional(),
    hours: z.number().optional()

    // siteName: z
    //     .string()
    //     .min(1, "Site name is required"),

    // address: z
    //     .string()
    //     .min(1, "Address is required"),

    // city: z
    //     .string()
    //     .min(1, "City is required"),

    // postcode: z
    //     .string()
    //     .min(1, "Postcode is required"),

    // country: z
    //     .string()
    //     .min(1, "Country is required"),

    // latitude: z.number(),

    // longitude: z.number(),
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
    ]).optional(),
});