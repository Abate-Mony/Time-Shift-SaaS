import { Outlet } from "react-router"

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