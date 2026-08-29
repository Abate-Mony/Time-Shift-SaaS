import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import customFetch from "./customFetch";
import type { CreateJobForm, EditProfileForm, EventNotificationPreference, InvoiceStatus, NotificationEvent, NotificationPreferences, TimesheetSummaryResponse } from "./types";

import { getCurrentPosition } from "./getPosition";

export const changeWorkerJobStaus = async (
    jobId: string,
    status: "accepted" | "declined" | "in-progress" | "completed",
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
        await customFetch.post(`/workers/open-shifts/${jobId}/claim`);

        toast.success("Shift picked up successfully");

        await queryClient.invalidateQueries({ queryKey: ["jobs"] });
        await queryClient.invalidateQueries({ queryKey: ["open-shifts"] });
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