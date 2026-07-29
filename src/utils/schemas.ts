import { z } from "zod"
export const createJobSchema = z.object({
    _id: z
        .string().optional(),
    title: z
        .string()
        .min(3, "Job title is required"),

    description: z
        .string()
        .min(5, "Description is required"),

    company: z
        .string()
        .min(2, "Company is required"),

    priority: z.enum([
        "low",
        "medium",
        "high",
    ]),
    status: z.enum([
        "draft",
        "published",
        "assigned",
        "in-progress",
        "completed",
        "cancelled",
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
        .array(z.string())
        .min(1, "Please select at least one worker"),

    additional_notes: z
        .string()
        .optional(),
    location: z
        .string()
        .optional(),

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