import { createBrowserRouter, Navigate } from "react-router";
import { Calendar, CreateJob, Dashboard, dashboardLoader, Jobs, Locations, loginAction, Reports, Settings, Workers, workersLoader } from "../pages"
import DashboardLayout from "../layouts/dashboardlayout";
import AuthLayout from "@/layouts/AuthLayout";
import { queryClient } from "@/lib/queryClient";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <DashboardLayout />,
        loader: dashboardLoader(queryClient),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: "dashboard",
                element: <Navigate to="/" replace />,
            },
            {
                path: "create-job",
                element: <CreateJob />,
            },
            {
                path: "jobs",
                element: <Jobs />,
            },
            {
                path: "workers",
                element: <Workers />,
                loader: workersLoader(queryClient)
            },
            {
                path: "workers",
                element: <Workers />,
            },
            {
                path: "calendar",
                element: <Calendar />,
            },
            {
                path: "locations",
                element: <Locations />,
            },
            {
                path: "reports",
                element: <Reports />,
            },
            {
                path: "timesheets",
                element: <Reports />,
            },
            {
                path: "analytics",
                element: <Dashboard />,
            },
            {
                path: "billing",
                element: <Settings />
            }
        ],
    }, {
        path: "auth",
        element: <AuthLayout />,
        action: loginAction
    }
]);