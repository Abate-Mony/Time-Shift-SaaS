import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import customFetch from "./customFetch";
import type { ClientBillingInfo, CreateJobForm, EditProfileForm, EligibleWorkResponse, EventNotificationPreference, Invoice, InvoiceAdjustmentInput, InvoiceCompanyInfo, InvoiceStatus, NotificationEvent, NotificationPreferences, TimesheetSummaryResponse } from "./types";
import type {
    AccessLevel,
    AccountRestriction,
    RestrictionCapability,
    RestrictionReason,
    RestrictionRemedy,
} from "@/data/restrictionMockData";

import { getCurrentPosition } from "./getPosition";

export const changeWorkerJobStaus = async (
    jobId: string,
    status: "accepted" | "declined" | "in-progress" | "completed" | "cancelled",
    opts?: { reason?: string }
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
        });

        toast.success("Job updated successfully");

        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        await queryClient.invalidateQueries({ queryKey: ["job", jobId] });
        await queryClient.invalidateQueries({ queryKey: ["worker-stats"] });

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

export const sendInvoice = async (invoiceId: string): Promise<boolean> => {
    try {
        await customFetch.post(`/invoices/${invoiceId}/send`);

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
        worker: { _id: string; fullname: string } | null
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