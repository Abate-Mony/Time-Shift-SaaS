import ErrorElement from "@/components/ErrorElement";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/signup-form";
import AuthLayout, { authLoader } from "@/layouts/AuthLayout";
import { WorkerAppLayout, workerRouteLoader } from "@/layouts/workerLayout";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/404Page";
import ClockScreen from "@/pages/worker/ClockScreenPage";
import JobDetailScreen from "@/pages/worker/JobDetailspage";
import JobsScreen from "@/pages/worker/JobScreen";
import ScheduleScreen from "@/pages/worker/ScheduleScreen";
import HomeScreen from "@/pages/worker/WorkerDashboard";
import NotificationPreferencesScreen from "@/pages/worker/NotificationPreferences";
import EditProfileScreen from "@/pages/worker/EditProfile";
// import ProfileScreen from "@/pages/worker/WorkerProfilepage";
import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "../layouts/dashboardlayout";
import { Calendar, calendarLoader, clockLoader, CreateJob, createjobAction, Dashboard, dashboardLoader, EditJob, editJobAction, InvoiceDetail, invoiceDetailLoader, InvoiceForm, invoiceFormLoader, Invoices, invoicesLoader, JobDetail, Jobs, jobsLoader, Locations, loginAction, ProfileScreen, Reports, Settings, settingsLoader, signupAction, singleJobLoader, singleWorkerJobLoader, workerLoader, WorkerProfile, workerProfileLoader, Workers, workersLoader } from "../pages";
import RootLayout from "@/layouts/RootLayout";
import { NoActiveShift } from "@/components/ui/No_Active_Job";

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
                        path: "workers/:id/worker-profile",
                        element: <WorkerProfile />,
                    },
                    {
                        path: "billing",
                        element: <Settings />
                    },
                    {
                        path: "settings",
                        element: <Settings />,
                        loader: settingsLoader(queryClient),
                    },
                    {
                        path: "*",
                        element: <NotFound />
                    }
                ],
            }, {
                path: "auth",
                element: <AuthLayout />,
                loader: authLoader(queryClient),
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
                loader: workerRouteLoader(queryClient),
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
                        element: <ProfileScreen />,
                        loader: workerProfileLoader
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
                        path: "jobs/:id",
                        element: <JobDetailScreen />,
                        loader: singleWorkerJobLoader,
                        errorElement: <ErrorElement />,

                    },
                    {
                        path: "clock",
                        element: <ClockScreen />,
                        loader: clockLoader,
                        errorElement: <ErrorElement />,

                    }, {
                        path: "clock/no-active-job",
                        element: <NoActiveShift />
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