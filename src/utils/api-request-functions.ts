import toast from "react-hot-toast";
import customFetch from "./customFetch";
import { queryClient } from "@/lib/queryClient";
import { isAxiosError } from "axios";

  export const changeWorkerJobStaus = async (
        jobId: string,
        status: "accepted" | "declined" | "in-progress" | "completed"
    ) => {
        try {
            await customFetch.patch(`/workers/${jobId}/status`, {
                status,
            });

            toast.success(
                status === "accepted"
                    ? "Job accepted successfully."
                    : "Job declined successfully."
            );

            // Refresh worker jobs
            await queryClient.invalidateQueries({
                queryKey: ["jobs"],
            });

            // Refresh single job if it's open
            await queryClient.invalidateQueries({
                queryKey: ["worker-job", jobId],
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