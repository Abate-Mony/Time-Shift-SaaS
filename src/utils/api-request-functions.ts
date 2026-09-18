import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import customFetch from "./customFetch";
import type { ClientBillingInfo, CompanyPlanId, CompanyPlanInfo, CreateJobForm, EditProfileForm, EligibleWorkResponse, EventNotificationPreference, FileRef, Invoice, InvoiceAdjustmentInput, InvoiceCompanyInfo, InvoiceStatus, JobAttachment, NotificationEvent, NotificationPreferences, PlanCatalogEntry, PlanCatalogResponse, TimesheetSummaryResponse, User, WorkerDocument } from "./types";
import type {
    AccessLevel,
    AccountRestriction,
    RestrictionCapability,
    RestrictionReason,
    RestrictionRemedy,
} from "@/data/restrictionMockData";

import { getCurrentPosition } from "./getPosition";
import type { InvoiceTemplate, InvoiceTemplateInput } from "./types/invoiceTemplate";
import type { Quote, QuoteFormInput } from "./types/quote";
import type { EmailSettings, EmailSettingsResponse, SendTestEmailResult } from "./types/emailSettings";

// Shape of POST /ai/job-draft's response. Every field on `draft` is a
// best-effort guess the model made from a free-text prompt — nothing here
// is written to the database; CreateJob.tsx only uses it to prefill the
// normal wizard for the manager to review and submit themselves.
export type AIJobDraft = {
    title: string | null;
    description: string | null;
    clientName: string | null;
    // priority/chargeType/openToClaims/requiresApproval are never null on
    // the wire — the backend schema falls back to this app's own form
    // defaults ("medium"/"hourly"/false/true) rather than emitting null,
    // to stay under the structured-output API's nullable-field limit.
    priority: "low" | "medium" | "high" | "urgent";
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    address: string | null;
    requiredWorkers: number | null;
    payRate: number | null;
    chargeType: "hourly" | "fixed";
    chargeRate: number | null;
    chargeAmount: number | null;
    instructions: string | null;
    notes: string | null;
    openToClaims: boolean;
    requiresApproval: boolean;
    assumptions: string[];
};

export type AIJobDraftResponse = {
    draft: AIJobDraft;
    matchedClient: { id: string; name: string } | null;
    unmatchedClientName: string | null;
};

// POST /ai/job-draft — turns a free-text prompt into a structured job draft.
// AI-only, no side effects: nothing is saved until the manager reviews and
// submits it through the normal CreateJob wizard.
export const generateJobDraftAI = async (prompt: string): Promise<AIJobDraftResponse> => {
    const { data } = await customFetch.post<AIJobDraftResponse>("/ai/job-draft", { prompt });
    return data;
};

export type AIDashboardInsight = {
    severity: "info" | "warning" | "critical";
    title: string;
    detail: string;
};

export type AIDashboardInsightsResponse = {
    headline: string;
    insights: AIDashboardInsight[];
};

// GET /ai/dashboard-insights — manager-triggered only (never auto-runs on
// dashboard load, since each call is a real billed request). Re-derives its
// summary server-side from the same numbers the dashboard cards show.
export const getDashboardInsightsAI = async (): Promise<AIDashboardInsightsResponse> => {
    const { data } = await customFetch.get<AIDashboardInsightsResponse>("/ai/dashboard-insights");
    return data;
};

// ── Worker documents ────────────────────────────────────────────────────
// Self-service — a worker uploads/removes their own documents (ID,
// right-to-work, certifications, ...). Entirely optional everywhere.

export const getMyDocuments = async (): Promise<WorkerDocument[]> => {
    const { data } = await customFetch.get<{ documents: WorkerDocument[] }>("/documents/me");
    return data.documents;
};

export const uploadMyDocument = async ({ name, file }: { name: string; file: File }): Promise<WorkerDocument[]> => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("document", file);
    const { data } = await customFetch.post<{ documents: WorkerDocument[] }>("/documents/me", formData);
    return data.documents;
};

export const deleteMyDocument = async (documentId: string): Promise<WorkerDocument[]> => {
    const { data } = await customFetch.delete<{ documents: WorkerDocument[] }>(`/documents/me/${documentId}`);
    return data.documents;
};

// Admin/manager view of one worker's documents.
export const getWorkerDocuments = async (workerId: string): Promise<{ documents: WorkerDocument[]; workerName: string }> => {
    const { data } = await customFetch.get<{ documents: WorkerDocument[]; workerName: string }>(
        `/documents/worker/${workerId}`
    );
    return data;
};

// ── Job attachment ──────────────────────────────────────────────────────
// Optional single file a manager attaches to a job (e.g. a photo of a door
// passcode) — uploaded separately from the JSON create/update payload since
// it needs multipart/form-data.

export const uploadJobAttachment = async ({ jobId, file }: { jobId: string; file: File }): Promise<JobAttachment> => {
    const formData = new FormData();
    formData.append("attachment", file);
    const { data } = await customFetch.post<{ attachment: JobAttachment }>(`/jobs/${jobId}/attachment`, formData);
    return data.attachment;
};

export const deleteJobAttachment = async (jobId: string): Promise<void> => {
    await customFetch.delete(`/jobs/${jobId}/attachment`);
};

// ── Profile photo ────────────────────────────────────────────────────────
// A personal account setting — any role can set their own. Invalidate the
// shared ["user"] query key after either call so the header/sidebar avatar
// (which reads the same cached user object) picks it up immediately.

export const uploadProfilePhoto = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("photo", file);
    const { data } = await customFetch.post<{ user: User }>("/users/current-user/photo", formData);
    return data.user;
};

export const deleteProfilePhoto = async (): Promise<User> => {
    const { data } = await customFetch.delete<{ user: User }>("/users/current-user/photo");
    return data.user;
};

// ── Company logo ─────────────────────────────────────────────────────────
// Admin-only — a company's logo is a shared, account-wide asset.

export const uploadCompanyLogo = async (file: File): Promise<FileRef> => {
    const formData = new FormData();
    formData.append("logo", file);
    const { data } = await customFetch.post<{ logo: FileRef }>("/companies/logo", formData);
    return data.logo;
};

export const deleteCompanyLogo = async (): Promise<void> => {
    await customFetch.delete("/companies/logo");
};

// ── Invoice templates ────────────────────────────────────────────────────
// Same pool the quote picker reads from too — see quoteModel.ts's comment
// on why templates aren't split per document type.

export const getInvoiceTemplates = async (): Promise<InvoiceTemplate[]> => {
    const { data } = await customFetch.get<{ templates: InvoiceTemplate[] }>("/invoice-templates");
    return data.templates;
};

export const setDefaultInvoiceTemplate = async (templateId: string | null): Promise<string | null> => {
    const { data } = await customFetch.patch<{ defaultInvoiceTemplate: string | null }>("/companies/invoice-template", { templateId });
    return data.defaultInvoiceTemplate;
};

// ── Custom template builder ──────────────────────────────────────────────
// Same "themed knobs" pool as the 10 system presets — never a freeform
// layout designer, see invoiceTemplateController.ts's comment.

export const createInvoiceTemplate = async (payload: InvoiceTemplateInput & { name: string }): Promise<InvoiceTemplate> => {
    const { data } = await customFetch.post<{ template: InvoiceTemplate }>("/invoice-templates", payload);
    return data.template;
};

export const updateInvoiceTemplate = async (id: string, payload: InvoiceTemplateInput): Promise<InvoiceTemplate> => {
    const { data } = await customFetch.patch<{ template: InvoiceTemplate }>(`/invoice-templates/${id}`, payload);
    return data.template;
};

export const deleteInvoiceTemplate = async (id: string): Promise<boolean> => {
    try {
        await customFetch.delete(`/invoice-templates/${id}`);
        toast.success("Template deleted");
        await queryClient.invalidateQueries({ queryKey: ["invoice-templates"] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

// ── Email & Sending ──────────────────────────────────────────────────────
// Left throwing (not toast-wrapped) for get/update/connect/verify — the
// Email Settings page shows richer inline feedback (DNS record states,
// step errors) than a toast alone, so the caller decides how to surface a
// failure. remove/test are simple one-shot actions, so those keep the
// toast+boolean pattern used elsewhere in this file (cancelInvoice, etc).

export const getEmailSettings = async (): Promise<EmailSettingsResponse> => {
    const { data } = await customFetch.get<EmailSettingsResponse>("/companies/email-settings");
    return data;
};

export const updateEmailSettings = async (payload: {
    senderName?: string;
    replyToEmail?: string;
    senderLocalPart?: string;
}): Promise<EmailSettings> => {
    const { data } = await customFetch.patch<{ settings: EmailSettings }>("/companies/email-settings", payload);
    return data.settings;
};

export const connectEmailDomain = async (domain: string): Promise<EmailSettingsResponse> => {
    const { data } = await customFetch.post<EmailSettingsResponse>("/companies/email-domain", { domain });
    return data;
};

export const verifyEmailDomain = async (): Promise<EmailSettingsResponse> => {
    const { data } = await customFetch.post<EmailSettingsResponse>("/companies/email-domain/verify");
    return data;
};

export const removeEmailDomain = async (): Promise<boolean> => {
    try {
        await customFetch.delete("/companies/email-domain");
        toast.success("Sending domain removed — INPRN emails will use the fallback address");
        await queryClient.invalidateQueries({ queryKey: ["email-settings"] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

export const sendTestEmail = async (email: string): Promise<SendTestEmailResult | null> => {
    try {
        const { data } = await customFetch.post<SendTestEmailResult>("/companies/email-domain/test", { email });
        toast.success("Test email sent");
        return data;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return null;
    }
};

// ── Quotes ────────────────────────────────────────────────────────────────

export const createQuote = async (payload: QuoteFormInput): Promise<Quote> => {
    const { data } = await customFetch.post<{ quote: Quote }>("/quotes", payload);
    return data.quote;
};

// Draft-only on the backend — the caller is responsible for only offering
// this while the quote is still a draft (see quoteController.ts's
// updateQuote).
export const updateQuote = async (quoteId: string, payload: Partial<QuoteFormInput>): Promise<Quote> => {
    const { data } = await customFetch.patch<{ quote: Quote }>(`/quotes/${quoteId}`, payload);
    return data.quote;
};

export const deleteQuote = async (quoteId: string): Promise<boolean> => {
    try {
        await customFetch.delete(`/quotes/${quoteId}`);
        toast.success("Quote deleted");
        await queryClient.invalidateQueries({ queryKey: ["quotes"] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

// Emails the quote (PDF attached) to the client and flips draft -> sent —
// see quoteController.ts's sendQuoteHandler. Takes no body: send whatever
// is currently saved, so callers must persist edits (updateQuote) first.
// Covers both the first send and a resend (sent/viewed -> sent again with
// a rotated response link) — the backend now accepts either. templateId
// lets the send-time picker choose a look for this document; omitted, the
// backend reuses whatever's already resolved/locked.
export const sendQuote = async (quoteId: string, templateId?: string): Promise<boolean> => {
    try {
        await customFetch.post(`/quotes/${quoteId}/send`, templateId ? { template: templateId } : {});
        toast.success("Quote sent to client");
        await queryClient.invalidateQueries({ queryKey: ["quotes"] });
        await queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

export const cancelQuote = async (quoteId: string, cancellationReason?: string): Promise<boolean> => {
    try {
        await customFetch.patch(`/quotes/${quoteId}/cancel`, { cancellationReason });
        toast.success("Quote cancelled");
        await queryClient.invalidateQueries({ queryKey: ["quotes"] });
        await queryClient.invalidateQueries({ queryKey: ["quote", quoteId] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

export const changeWorkerJobStaus = async (
    jobId: string,
    status: "accepted" | "declined" | "in-progress" | "completed" | "cancelled",
    opts?: { reason?: string; release?: boolean }
): Promise<{ success: boolean; message?: string }> => {
    try {
        // Only clock-in and clock-out are worth locating. Asking for GPS on
        // accept/decline is a permission prompt for no reason.
        const needsLocation = status === "in-progress" || status === "completed";
        const location = needsLocation ? await getCurrentPosition() : undefined;

        await customFetch.patch(`/workers/${jobId}/status`, {
            status,
            ...(location ? { location } : {}),
            ...(opts?.reason ? { reason: opts.reason } : {}),
            ...(opts?.release ? { release: true } : {}),
        });

        toast.success(opts?.release ? "Shift released back to open shifts" : "Job updated successfully");

        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        await queryClient.invalidateQueries({ queryKey: ["job", jobId] });
        await queryClient.invalidateQueries({ queryKey: ["worker-stats"] });
        if (opts?.release) {
            await queryClient.invalidateQueries({ queryKey: ["open-shifts"] });
        }

        // The shift is over — clear the active job immediately rather than
        // waiting on a refetch, or the clock screen keeps showing a finished shift
        if (status === "completed" || status === "declined") {
            queryClient.setQueryData(["active-job"], { success: true, job: null });
        }
        await queryClient.invalidateQueries({ queryKey: ["active-job"] });

        return { success: true };
    } catch (err) {
        const message = isAxiosError(err)
            ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
            : err instanceof Error
                ? err.message
                : "Something went wrong.";

        toast.error(message);
        return { success: false, message };
    }
};

// ── Shift-completion note & photos ───────────────────────────────────────
// Both operate on the assignment, not the job — reached from the "shift
// complete" summary screen after the job has already been marked completed
// (and the active-job cache cleared), so ClockScreenPage.tsx must hang onto
// the assignment id itself rather than reading it off the (by then null)
// active job.

export const saveAssignmentNote = async (assignmentId: string, note: string): Promise<boolean> => {
    try {
        await customFetch.patch(`/workers/assignments/${assignmentId}/note`, { note });
        return true;
    } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.msg ?? "Couldn't save your note." : "Couldn't save your note.";
        toast.error(message);
        return false;
    }
};

export const uploadAssignmentPhoto = async (assignmentId: string, file: File): Promise<FileRef[] | null> => {
    try {
        const formData = new FormData();
        formData.append("photo", file);
        const { data } = await customFetch.post<{ completionPhotos: FileRef[] }>(
            `/workers/assignments/${assignmentId}/photos`,
            formData
        );
        return data.completionPhotos;
    } catch (err) {
        const message = isAxiosError(err) ? err.response?.data?.msg ?? "Couldn't upload that photo." : "Couldn't upload that photo.";
        toast.error(message);
        return null;
    }
};

export const startWorkerBreak = async (jobId: string): Promise<boolean> => {
    try {
        const { data } = await customFetch.patch(`/workers/${jobId}/break/start`);

        toast.success(data?.message ?? "Break started.");

        await queryClient.invalidateQueries({ queryKey: ["active-job"] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export const endWorkerBreak = async (jobId: string): Promise<boolean> => {
    try {
        const { data } = await customFetch.patch(`/workers/${jobId}/break/end`);

        toast.success(data?.message ?? "Break ended.");

        await queryClient.invalidateQueries({ queryKey: ["active-job"] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export const claimOpenShift = async (jobId: string): Promise<boolean> => {
    try {
        const { data } = await customFetch.post(`/workers/open-shifts/${jobId}/claim`);

        toast.success(
            data?.needsApproval
                ? "Claim sent — your manager needs to approve it"
                : "Shift picked up successfully"
        );

        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        await queryClient.invalidateQueries({ queryKey: ["open-shifts"] });
        return true;
    } catch (err) {
        // A restriction block (403) doesn't carry a `msg`/`message` field —
        // it carries the structured body from restrictionMiddleware, so it
        // needs its own branch or the toast would just say "Something went
        // wrong" for a worker who's actually restricted from claiming.
        const message =
            isAxiosError(err) && err.response?.data?.restricted
                ? err.response.data.message ?? "You're restricted from claiming shifts right now."
                : isAxiosError(err)
                    ? err.response?.data?.msg ??
                    err.response?.data?.message ??
                    "Something went wrong."
                    : err instanceof Error
                        ? err.message
                        : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export type OvertimeDecision = "approve" | "reject" | "adjust"

// Resolves a shift whose worked time overran its schedule by more than the
// company's threshold (see workerController.ts's clock-out handler) — only
// ever callable while the assignment's overtimeStatus is "pending".
// "approve" pays the full actual time, "reject" caps pay back to the
// scheduled amount, "adjust" sets a manager-chosen figure in between.
export const reviewAssignmentOvertime = async (
    assignmentId: string,
    decision: OvertimeDecision,
    opts?: { approvedMinutes?: number; managerNotes?: string }
): Promise<boolean> => {
    try {
        await customFetch.patch(`/workers/assignments/${assignmentId}/overtime`, { decision, ...opts });

        toast.success(
            decision === "approve" ? "Overtime approved" :
                decision === "reject" ? "Capped back to the scheduled time" :
                    "Approved hours adjusted"
        );

        await queryClient.invalidateQueries({ queryKey: ["job"] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export const reviewOpenShiftClaim = async (assignmentId: string, approve: boolean): Promise<boolean> => {
    try {
        await customFetch.patch(`/workers/assignments/${assignmentId}/claim-review`, { approve });

        toast.success(approve ? "Claim approved" : "Claim declined");

        await queryClient.invalidateQueries({ queryKey: ["job"] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    try {
        await customFetch.patch(`/invoices/${invoiceId}/status`, { status });

        toast.success("Invoice updated successfully");

        await queryClient.invalidateQueries({
            queryKey: ["invoices"],
        });

        await queryClient.invalidateQueries({
            queryKey: ["invoice", invoiceId],
        });
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
    }
};

export const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
    try {
        await customFetch.delete(`/invoices/${invoiceId}`);

        toast.success("Invoice deleted");

        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export const sendInvoice = async (invoiceId: string, templateId?: string): Promise<boolean> => {
    try {
        await customFetch.post(`/invoices/${invoiceId}/send`, templateId ? { template: templateId } : {});

        toast.success("Invoice sent to client");

        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        await queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

// GET /invoices/eligible-work?client=&start=&end= — powers the create-invoice
// picker. Backend recalculates everything server-side; this is read-only.
export const getEligibleWork = async ({
    client,
    start,
    end,
}: {
    client: string;
    start: string;
    end: string;
}): Promise<EligibleWorkResponse> => {
    const { data } = await customFetch.get<EligibleWorkResponse>("/invoices/eligible-work", {
        params: { client, start, end },
    });
    return data;
};

// GET /invoices/billing-info?client= — the client's billing cadence, the
// period currently open for it, and what the last invoice covered.
export const getClientBillingInfo = async (client: string): Promise<ClientBillingInfo> => {
    const { data } = await customFetch.get<ClientBillingInfo>("/invoices/billing-info", {
        params: { client },
    });
    return data;
};

// POST /invoices/draft — creates a draft from selected eligible-work items.
// The backend re-queries and recalculates from the ids alone; amounts are
// never sent from here.
export const createInvoiceDraft = async ({
    client,
    servicePeriod,
    jobIds,
    assignmentIds,
    adjustments,
    issueDate,
    dueDate,
    notes,
    purchaseOrderNumber,
}: {
    client: string;
    servicePeriod: { start: string; end: string };
    jobIds?: string[];
    assignmentIds?: string[];
    adjustments?: InvoiceAdjustmentInput[];
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    purchaseOrderNumber?: string;
}): Promise<Invoice> => {
    const { data } = await customFetch.post("/invoices/draft", {
        client,
        servicePeriod,
        jobIds,
        assignmentIds,
        adjustments,
        issueDate,
        dueDate,
        notes,
        purchaseOrderNumber,
    });
    return data.invoice as Invoice;
};

export const markInvoicePaid = async (
    invoiceId: string,
    payload?: { amountPaid?: number; paymentReference?: string; paymentMethod?: string; paymentNotes?: string }
): Promise<boolean> => {
    try {
        await customFetch.patch(`/invoices/${invoiceId}/mark-paid`, payload ?? {});
        toast.success("Invoice marked as paid");
        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        await queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

export const cancelInvoice = async (invoiceId: string, cancellationReason?: string): Promise<boolean> => {
    try {
        await customFetch.patch(`/invoices/${invoiceId}/cancel`, { cancellationReason });
        toast.success("Invoice cancelled");
        await queryClient.invalidateQueries({ queryKey: ["invoices"] });
        await queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
        return true;
    } catch (err) {
        toast.error(getApiErrorMessage(err));
        return false;
    }
};

export const updateWorkerProfile = async (profile: EditProfileForm): Promise<boolean> => {
    try {
        await customFetch.patch("/users/current-user", profile);

        toast.success("Profile updated successfully");

        await queryClient.invalidateQueries({
            queryKey: ["user"],
        });
        return true;
    } catch (err) {
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);
        return false;
    }
};

export type UpdateNotificationPreferencesPayload = {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;

    events?: Partial<
        Record<
            NotificationEvent,
            Partial<EventNotificationPreference>
        >
    >;
};

export const updateNotificationPreferences = async (
    preferences: UpdateNotificationPreferencesPayload
) => {
    try {
        await customFetch.patch(
            "/notification-preferences/me",
            preferences
        );

        toast.success("Notification preferences saved");

        await queryClient.invalidateQueries({
            queryKey: ["user"],
        });
    } catch (err) {
        console.log(err)
        const message =
            isAxiosError(err)
                ? err.response?.data?.msg ??
                err.response?.data?.message ??
                "Something went wrong."
                : err instanceof Error
                    ? err.message
                    : "Something went wrong.";

        toast.error(message);

        throw err;
    }
};
export const duplicateJob = async (id: string) => {
    return await customFetch.post(`/jobs/duplicate-job/${id}`)
}

// PATCH /jobs/:id has no separate add/remove-worker endpoints — the backend
// diffs the `workers` array you send against the job's current assignments
// (anything missing gets marked removed, anything new gets inserted), so
// both "add" and "remove" are just this same call with a different array.
export const updateJobWorkers = async (
    jobId: string,
    workers: CreateJobForm["workers"],
    successMessage = "Workers updated"
): Promise<boolean> => {
    try {
        await customFetch.patch(`/jobs/${jobId}`, { workers })

        toast.success(successMessage)

        await queryClient.invalidateQueries({ queryKey: ["job", jobId] })
        await queryClient.invalidateQueries({ queryKey: ["jobs"] })
        return true
    } catch (err) {
        const message = isAxiosError(err)
            ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
            : err instanceof Error
                ? err.message
                : "Something went wrong.";

        toast.error(message)
        return false
    }
}

export type TimesheetPeriodType = "weekly" | "biweekly" | "monthly"

// Blob responses carry JSON error bodies as a Blob too (responseType is
// fixed per-request), so a failed request needs its body read back out as
// text before the usual err.response?.data?.msg extraction works.
const extractBlobErrorMessage = async (err: unknown): Promise<string> => {
    if (!isAxiosError(err)) return err instanceof Error ? err.message : "Something went wrong."

    const data = err.response?.data
    if (data instanceof Blob) {
        try {
            const parsed = JSON.parse(await data.text())
            return parsed?.msg ?? parsed?.message ?? "Something went wrong."
        } catch {
            return "Something went wrong."
        }
    }

    const responseData = data as { msg?: string; message?: string } | undefined
    return responseData?.msg ?? responseData?.message ?? "Something went wrong."
}

export const getNotificationPreferences =
    async () => {
        const { data } = await customFetch.get<{
            success: boolean;
            preferences: NotificationPreferences;
        }>(
            "/notification-preferences/me"
        );

        return data;
    };
export const getTimesheetSummary = async ({
    period,
    start,
    end,
}: {
    period: TimesheetPeriodType;
    start: string;
    end: string;
}) => {
    const { data } =
        await customFetch.get<{
            summary: TimesheetSummaryResponse
        }>(
            "/timesheets/",
            {
                params: {
                    period,
                    startDate: start,
                    endDate: end,
                },
            }
        );
    return data;
};

// Admin/manager viewing a specific worker's timesheet summary on-screen —
// mirrors getTimesheetSummary above, just against /timesheets/:id. start/end
// are optional here (unlike the worker's own version, this view has no
// period-paging UI) — omitted, the backend defaults to "the current period".
export const getWorkerTimesheet = async ({
    workerId,
    period,
    start,
    end,
}: {
    workerId: string;
    period: TimesheetPeriodType;
    start?: string;
    end?: string;
}) => {
    const { data } =
        await customFetch.get<{
            start: string;
            end: string;
            summary: TimesheetSummaryResponse
        }>(
            `/timesheets/${workerId}`,
            {
                params: {
                    period,
                    ...(start && end ? { startDate: start, endDate: end } : {}),
                },
            }
        );
    return data;
};

export const downloadTimesheet = async ({
    period,
    start,
    end,
}: {
    period: TimesheetPeriodType;
    start: string;
    end: string;
}): Promise<boolean> => {
    try {
        const response = await customFetch.get(
            "/timesheets/me/pdf",
            {
                params: {
                    period,
                    startDate: start,
                    endDate: end,
                },
                responseType: "blob",
            }
        );

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `timesheet-${period}-${start}-${end}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        return true;
    } catch (err) {
        toast.error(await extractBlobErrorMessage(err));
        return false;
    }
};

// Admin/manager downloading a specific worker's timesheet — mirrors
// downloadTimesheet above, just against /timesheets/:id/pdf and a plain
// date range rather than the worker's own "period" picker.
export const downloadWorkerTimesheet = async ({
    workerId,
    start,
    end,
}: {
    workerId: string;
    start: string;
    end: string;
}): Promise<boolean> => {
    try {
        const response = await customFetch.get(
            `/timesheets/${workerId}/pdf`,
            {
                params: { startDate: start, endDate: end },
                responseType: "blob",
            }
        );

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `timesheet-${workerId}-${start}-${end}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

        return true;
    } catch (err) {
        toast.error(await extractBlobErrorMessage(err));
        return false;
    }
};
export const deleteJob = async (id: string) => {
    try {
        await customFetch.delete(`/jobs/${id}`)
        queryClient.invalidateQueries({ queryKey: ["jobs"] })
        queryClient.invalidateQueries({ queryKey: ["job",id] })
        toast.success("Job deleted successfully")
    } catch (e) {
        toast.error("Failed to delete job, try again later")
    }
}

// ─────────────────────────────────────────────
// User restrictions ("suspend a user")
// ─────────────────────────────────────────────

const getApiErrorMessage = (err: unknown): string =>
    isAxiosError(err)
        ? err.response?.data?.msg ?? err.response?.data?.message ?? "Something went wrong."
        : err instanceof Error
            ? err.message
            : "Something went wrong.";

export interface CreateRestrictionPayload {
    user: string
    reason: RestrictionReason
    message: string
    internalNote?: string
    accessLevel: AccessLevel
    restrictions: RestrictionCapability[]
    remedy: RestrictionRemedy
    canAppeal: boolean
    expiresAt?: string
}

// POST /restrictions — admin/manager only. Throws on failure so the caller
// (the RestrictUserDialog flow) can keep its own dialog open and show why,
// rather than this function guessing what the caller should do next.
export const createRestriction = async (payload: CreateRestrictionPayload): Promise<AccountRestriction> => {
    try {
        const { data } = await customFetch.post<{ restriction: AccountRestriction }>("/restrictions", {
            ...payload,
            expiresAt: payload.expiresAt || undefined,
        })
        toast.success(`${payload.accessLevel === "none" ? "Account suspended" : "Restriction applied"}`)
        queryClient.invalidateQueries({ queryKey: ["restrictions"] })
        queryClient.invalidateQueries({ queryKey: ["team"] })
        return data.restriction
    } catch (err) {
        const message = getApiErrorMessage(err)
        toast.error(message)
        throw new Error(message)
    }
}

// GET /restrictions?status=active — admin/manager only. Used to merge each
// team member's current restriction (if any) into the Team list.
export const getActiveRestrictions = async (): Promise<AccountRestriction[]> => {
    const { data } = await customFetch.get<{ restrictions: (AccountRestriction & { user: { _id: string } })[] }>(
        "/restrictions",
        { params: { status: "active", limit: 200 } }
    )
    return data.restrictions
}

export const liftRestriction = async (restrictionId: string, liftReason?: string): Promise<boolean> => {
    try {
        await customFetch.patch(`/restrictions/${restrictionId}/lift`, { liftReason })
        toast.success("Restriction lifted")
        queryClient.invalidateQueries({ queryKey: ["restrictions"] })
        queryClient.invalidateQueries({ queryKey: ["team"] })
        return true
    } catch (err) {
        toast.error(getApiErrorMessage(err))
        return false
    }
}

export const respondToRestrictionAppeal = async (
    restrictionId: string,
    status: "accepted" | "rejected",
    response: string
): Promise<boolean> => {
    try {
        await customFetch.patch(`/restrictions/${restrictionId}/appeal`, { status, response })
        toast.success(status === "accepted" ? "Appeal approved" : "Appeal declined")
        queryClient.invalidateQueries({ queryKey: ["restrictions"] })
        queryClient.invalidateQueries({ queryKey: ["team"] })
        return true
    } catch (err) {
        toast.error(getApiErrorMessage(err))
        return false
    }
}

// GET /restrictions/me — any authenticated user. Never returns internalNote.
export const getMyRestriction = async (): Promise<AccountRestriction | null> => {
    const { data } = await customFetch.get<{ restriction: AccountRestriction | null }>("/restrictions/me")
    return data.restriction
}

// POST /restrictions/me/appeal — the restricted user themselves.
export const submitRestrictionAppeal = async (message: string): Promise<boolean> => {
    try {
        await customFetch.post("/restrictions/me/appeal", { message })
        toast.success("Appeal submitted")
        queryClient.invalidateQueries({ queryKey: ["my-restriction"] })
        return true
    } catch (err) {
        toast.error(getApiErrorMessage(err))
        return false
    }
}

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────

export type AnalyticsRange = "7d" | "30d" | "90d" | "year"

export interface AnalyticsResponse {
    range: AnalyticsRange
    period: { start: string; end: string }
    kpis: {
        totalHours: { value: number; deltaPercent: number | null }
        jobsCompleted: { value: number; deltaPercent: number | null }
        activeWorkers: { value: number; deltaPercent: number | null }
        completionRate: { value: number | null; deltaPercent: number | null }
    }
    hoursTrend: { label: string; hours: number; priorHours: number }[]
    jobStatusBreakdown: { status: string; label: string; count: number }[]
    workerClockInActivity: { label: string; onTime: number; late: number; noShow: number }[]
    regularVsOvertime: { label: string; regular: number; overtime: number }[]
    topWorkers: { workerId: string; fullname: string; hours: number; jobs: number; completionRate: number }[]
    locationPerformance: { location: string; jobs: number; hours: number; completionRate: number }[]
    insights: { peakDay: string | null; avgShiftMinutes: number; overtimeRatePercent: number }
}

export const getAnalytics = async (range: AnalyticsRange): Promise<AnalyticsResponse> => {
    const { data } = await customFetch.get<AnalyticsResponse>("/analytics", { params: { range } })
    return data
}

// ─────────────────────────────────────────────
// Admin/manager dashboard
// ─────────────────────────────────────────────

export interface DashboardStatsJob {
    _id: string
    title: string
    location: string
    startTime: string
    endTime: string
    status: string
    priority?: string
    requiredWorkers?: number
}

export interface DashboardStatsActivity {
    _id: string
    type: string
    actor?: { _id: string; fullname: string } | null
    job?: { _id: string; title: string } | null
    createdAt: string
}

export interface DashboardStatsResponse {
    stats: {
        todaysJobs: { count: number; inProgress: number; deltaFromYesterday: number }
        workersActive: { active: number; total: number }
        hoursThisWeek: { total: number; target: number }
        jobsCompleted: { thisMonth: number; deltaPercent: number | null }
    }
    hoursByDay: { day: string; hours: number }[]
    workingNow: {
        assignmentId: string
        worker: { _id: string; fullname: string; profilePhoto?: FileRef | null } | null
        job: { _id: string; title: string; location: string; startTime: string; endTime: string } | null
        checkedInAt: string
    }[]
    todaysJobs: DashboardStatsJob[]
    recentActivity: DashboardStatsActivity[]
    attentionNeeded: { jobId: string; title: string } | null
    pendingOvertime: {
        count: number
        items: {
            assignmentId: string
            jobId?: string
            jobTitle?: string
            workerName?: string
            overtimeMinutes?: number
        }[]
    }
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
    const { data } = await customFetch.get<DashboardStatsResponse>("/users/dashboardstats")
    return data
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export interface NotificationItem {
    _id: string
    type: string
    title: string
    body: string
    link: string | null
    isRead: boolean
    createdAt: string
}

export interface NotificationsResponse {
    notifications: NotificationItem[]
    page: number
    totalPages: number
    total: number
    unreadCount: number
}

export const getNotifications = async (page: number): Promise<NotificationsResponse> => {
    const { data } = await customFetch.get<NotificationsResponse>("/notifications", { params: { page, limit: 20 } })
    return data
}

export const markNotificationRead = async (id: string): Promise<void> => {
    await customFetch.patch(`/notifications/${id}/read`)
}

export const markAllNotificationsRead = async (): Promise<void> => {
    await customFetch.patch("/notifications/read-all")
}

// GET /companies/plans — the full pricing-page catalog (all four tiers).
// Replaces the old hand-maintained PLANS array in utils/constants/plant.ts,
// which had already drifted out of sync with the backend's real limits once.
export const getPlanCatalog = async (): Promise<PlanCatalogEntry[]> => {
    const { data } = await customFetch.get<PlanCatalogResponse>("/companies/plans")
    return data.plans
}

// GET /companies/plan — the company's actual plan and what it unlocks.
// Source of truth for the billing pages instead of the old hardcoded
// CURRENT_PLAN_ID mock.
export const getCompanyPlan = async (): Promise<CompanyPlanInfo> => {
    const { data } = await customFetch.get<CompanyPlanInfo>("/companies/plan")
    return data
}

// PATCH /companies/plan — no payment processing behind this yet (see the
// backend note on updateCompanyPlan); this just sets the field for real,
// replacing the checkout page's simulated round trip.
export const updateCompanyPlan = async (plan: CompanyPlanId): Promise<CompanyPlanId> => {
    const { data } = await customFetch.patch<{ plan: CompanyPlanId }>("/companies/plan", { plan })
    return data.plan
}