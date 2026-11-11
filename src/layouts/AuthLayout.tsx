import type { QueryClient } from "@tanstack/react-query";
import { Outlet, redirect } from "react-router";
import { userQuery } from "./dashboardlayout";

// Mirrors dashboardlayout's own loader redirects, so a signed-in user who
// lands back on /auth (e.g. a stale bookmark/back-button) is bounced to the
// same place they'd land from "/" rather than seeing the login form again.
export const authLoader = (queryClient: QueryClient) => async () => {
  try {
    const { user } = await queryClient.ensureQueryData(userQuery);
    if (user.role === "worker") {
      return redirect("/worker");
    }
    if (!user.company && user.platformRole) {
      return redirect("/platform");
    }
    return redirect("/");
  } catch {
    return null;   // not logged in — show the form
  }
};
const AuthLayout = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted ">
      <div className="flex w-full max-w-sm- flex-col gap-6">

        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout