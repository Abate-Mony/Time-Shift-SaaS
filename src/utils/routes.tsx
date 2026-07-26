import { createBrowserRouter, Navigate } from "react-router";
import { Calendar, CreateJob, Dashboard, Jobs, Locations, Reports, Settings, Workers } from "../pages"
import DashboardLayout from "../layouts/dashboardlayout";
import AuthLayout from "@/layouts/AuthLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <DashboardLayout />,
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
        element: <AuthLayout />
    }
]);