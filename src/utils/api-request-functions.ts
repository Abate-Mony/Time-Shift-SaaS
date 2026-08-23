import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import customFetch from "./customFetch";
import type { CreateJobForm, EditProfileForm, InvoiceStatus, NotificationPreferences } from "./types";

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

export const updateNotificationPreferences = async (
    preferences: Partial<NotificationPreferences>
) => {
    try {
        await customFetch.patch("/users/notification-preferences", preferences);

        toast.success("Notification preferences saved");

        await queryClient.invalidateQueries({
            queryKey: ["user"],
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
export const duplicateJob = async (id: string) => {
    return await customFetch.post(`/jobs/duplicate-job/${id}`)
}