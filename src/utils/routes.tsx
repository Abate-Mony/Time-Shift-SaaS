import ErrorElement from "@/components/ErrorElement";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/signup-form";
import AuthLayout from "@/layouts/AuthLayout";
import { WorkerAppLayout } from "@/layouts/workerLayout";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/404Page";
import ClockScreen from "@/pages/worker/ClockScreenPage";
import JobDetailScreen from "@/pages/worker/JobDetailspage";
import JobsScreen from "@/pages/worker/JobScreen";
import ScheduleScreen from "@/pages/worker/ScheduleScreen";
import HomeScreen from "@/pages/worker/WorkerDashboard";
import NotificationPreferencesScreen from "@/pages/worker/NotificationPreferences";
import EditProfileScreen from "@/pages/worker/EditProfile";
import ProfileScreen from "@/pages/worker/WorkerProfilepage";
import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "../layouts/dashboardlayout";
import { Calendar, calendarLoader, CreateJob, createjobAction, Dashboard, dashboardLoader, EditJob, editJobAction, InvoiceDetail, invoiceDetailLoader, InvoiceForm, invoiceFormLoader, Invoices, invoicesLoader, JobDetail, Jobs, jobsLoader, Locations, loginAction, Reports, Settings, signupAction, singleJobLoader, singleWorkerJobLoader, workerLoader, WorkerProfile, Workers, workersLoader } from "../pages";
import RootLayout from "@/layouts/RootLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorElement />,
        children: [

            {
                path: "/",
                element: <DashboardLayout />,
                loader: dashboardLoader(queryClient),
                errorElement: <ErrorElement />,

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
                        path: "jobs/:id/edit",
                        element: <EditJob />,
                        loader: singleJobLoader(queryClient),
                        action: editJobAction

                    },
                    {
                        path: "workers",
                        element: <Workers />,
                        loader: workersLoader(queryClient)
                    },
                    {
                        path: "jobs/:id",
                        element: <JobDetail />,
                        loader: singleJobLoader(queryClient),


                    },
                    {   
                        path: "invoices",
                        element: <Invoices />,
                        loader: invoicesLoader(queryClient),
                    },
                    {
                        path: "invoices/new",
                        element: <InvoiceForm />,
                        loader: invoiceFormLoader(queryClient),
                    },
                    {
                        path: "invoices/:id",
                        element: <InvoiceDetail />,
                        loader: invoiceDetailLoader(queryClient),
                    },

                    {
                        path: "calendar",
                        element: <Calendar />,
                        loader: calendarLoader,
                        errorElement: <ErrorElement />,

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
                        path: "user/:id/worker-profile",
                        element: <WorkerProfile />,
                    },
                    {
                        path: "billing",
                        element: <Settings />
                    },
                    {
                        path: "settings",
                        element: <Settings />
                    },
                    {
                        path: "*",
                        element: <NotFound />
                    }
                ],
            }, {
                path: "auth",
                element: <AuthLayout />,
                children: [
                    {
                        index: true,
                        element: <LoginForm />,
                        action: loginAction
                    },
                    {
                        path: "signup",
                        element: <SignUpForm />,
                        action: signupAction

                    },
                ]
            }, {
                path: "worker",
                element: <WorkerAppLayout />,
                loader: dashboardLoader(queryClient),
                errorElement: <ErrorElement />,
                children: [
                    {
                        index: true,
                        element: <HomeScreen />
                    },
                    {
                        path: "jobs",
                        element: <JobsScreen />,
                        loader: workerLoader(queryClient)


                    }, {
                        path: "profile",
                        element: <ProfileScreen />
                    },
                    {
                        path: "profile/notifications",
                        element: <NotificationPreferencesScreen />
                    },
                    {
                        path: "profile/edit",
                        element: <EditProfileScreen />
                    },
                    {
                        path: "schedule",
                        element: <ScheduleScreen />
                    },
                    {
                        path: "job/:id",
                        element: <JobDetailScreen />,
                        loader: singleWorkerJobLoader,
                        errorElement: <ErrorElement />,

                    },
                    {
                        path: "clock/:id",
                        element: <ClockScreen />,
                        loader: singleWorkerJobLoader,
                        errorElement: <ErrorElement />,

                    },
                    {
                        path: "*",
                        element: <NotFound />
                    }
                ]
            },
            {
                path: "*",
                element: <NotFound />
            },
      
        ]
    }

]);