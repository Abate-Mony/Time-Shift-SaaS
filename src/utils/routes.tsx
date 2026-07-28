import { createBrowserRouter, Navigate } from "react-router";
import { Calendar, CreateJob, createjobAction, Dashboard, dashboardLoader, Jobs, jobsLoader, Locations, loginAction, Reports, Settings, Workers, workersLoader } from "../pages"
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
                loader: workersLoader(queryClient),
                action: createjobAction
            },
            {
                path: "jobs",
                element: <Jobs />,
                loader: jobsLoader(queryClient)

            },
            {
                path: "workers",
                element: <Workers />,
                loader: workersLoader(queryClient)
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