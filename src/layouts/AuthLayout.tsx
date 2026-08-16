import type { QueryClient } from "@tanstack/react-query";
import { Outlet } from "react-router";
// import { userQuery } from "./dashboardlayout";
export const authLoader = (queryClient: QueryClient) => async () => {
  try {
    // const { user } = await queryClient.ensureQueryData(userQuery);
    // console.log("user here ")
    // return redirect(user.role === "worker" ? "/worker" : "/");
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