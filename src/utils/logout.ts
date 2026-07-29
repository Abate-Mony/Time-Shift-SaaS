import { queryClient } from "@/lib/queryClient";
import customFetch from "./customFetch";
import toast from "react-hot-toast";

export const logoutUser = async () => {
  toast.error("Session expired. Please log in again.");

  const from = window.location.href;

  await customFetch.get("/auth/logout");
  queryClient.clear();

  window.location.replace(
    `/auth?from=${encodeURIComponent(from)}`
  );
};