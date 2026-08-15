import toast from "react-hot-toast";
import customFetch from "./customFetch";
import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";
import { wait } from "./wait";
import type { EditProfileForm, InvoiceStatus, NotificationPreferences } from "./types";

export const changeWorkerJobStaus = async (
    jobId: string,
    status: "accepted" | "declined" | "in-progress" | "completed"
) => {
    try {
        // await wait()
        await customFetch.patch(`/workers/${jobId}/status`, {
            status,
        });

        toast.success(
            "Job updated successfully"
        );
        // Refresh worker jobs
        await queryClient.invalidateQueries({
            queryKey: ["jobs"],
        });

        // Refresh single job if it's open
        await queryClient.invalidateQueries({
            queryKey: ["worker-job", jobId],
        });
        await queryClient.invalidateQueries({ queryKey: ["worker-stats"]})
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