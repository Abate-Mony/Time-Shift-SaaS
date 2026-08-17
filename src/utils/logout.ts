import { queryClient } from "@/lib/queryClient";
import customFetch from "./customFetch";
import toast from "react-hot-toast";

// Prevents duplicate toasts/redirects when several requests 401 at once
// and each independently ends up calling logoutUser.
let isLoggingOut = false;

export const logoutUser = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  toast.error("Session expired. Please log in again.");

  const from = window.location.href;

  try {
    // Invalidates the refresh token server-side. The session may already be
    // dead at this point (that's often why we're here), so don't let a
    // failure here block clearing local state.
    await customFetch.post("/auth/logout");
  } catch {
    // ignore — falling through to clear local state regardless
  }

  queryClient.clear();

  window.location.replace(
    `/auth?from=${encodeURIComponent(from)}`
  );
};
