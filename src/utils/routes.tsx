import ErrorElement from "@/components/ErrorElement";
import { LoginForm } from "@/components/login-form";
import { SignUpForm } from "@/components/signup-form";
import AuthLayout, { authLoader } from "@/layouts/AuthLayout";
import SettingsLayout from "@/layouts/SettingsLayout";
import { WorkerAppLayout, workerRouteLoader } from "@/layouts/workerLayout";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/404Page";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import BillingSettings from "@/pages/settings/BillingSettings";
import CompanySettings from "@/pages/settings/CompanySettings";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ClockScreen from "@/pages/worker/ClockScreenPage";
import EditProfileScreen from "@/pages/worker/EditProfile";
import JobDetailScreen from "@/pages/worker/JobDetailspage";
import JobsScreen from "@/pages/worker/JobScreen";
import NotificationPreferencesScreen, { loader as notificationPreferencesLoader } from "@/pages/worker/NotificationPreferences";
import ScheduleScreen from "@/pages/worker/ScheduleScreen";
import HomeScreen from "@/pages/worker/WorkerDashboard";
// import ProfileScreen from "@/pages/worker/WorkerProfilepage";
import { NoActiveShift } from "@/components/ui/No_Active_Job";
import InvitationLayout from "@/layouts/AccpetInviteLayout";
import JobLayout from "@/layouts/JobLayout";
import RootLayout from "@/layouts/RootLayout";
import WorkerJobLayout from "@/layouts/WorkerJobLayout";
import AcceptInvitePage from "@/pages/acceptInvites/AcceptInvitePage";
import ExistingUserInvitePage from "@/pages/acceptInvites/ExistingUserInvitePage";
import InvitationStatusPage from "@/pages/acceptInvites/InvitationStatusPage";
import InvitationSuccessPage from "@/pages/acceptInvites/InvitationSuccessPage";
import NewUserInvitePage from "@/pages/acceptInvites/NewUserInvitePage";
import RecurringAssignmentPage, { loader as recurringAssignmentsLoader } from "@/pages/worker/RecurringAssignmentPage";
import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "../layouts/dashboardlayout";
import { Analytics, Calendar, calendarLoader, clockLoader, CreateJob, createjobAction, Dashboard, dashboardLoader, DownloadTimesheetScreen, EditJob, editJobAction, InvoiceDetail, invoiceDetailLoader, InvoiceForm, invoiceFormLoader, Invoices, invoicesLoader, JobDetail, Jobs, jobsLoader, Locations, loginAction, ProfileScreen, RecurringJobDetail, recurringJobDetailLoader, RecurringJobs, recurringJobsLoader, Reports, Settings, settingsLoader, signupAction, singleJobLoader, singleWorkerJobLoader, Team, teamLoader, workerLoader, WorkerProfile, workerProfileLoader, Workers, workersLoader } from "../pages";

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
                        element: <JobLayout />,
                        children: [

                            {
                                index: true,
                                element: <Jobs />,
                                loader: jobsLoader(queryClient)
                            }, {
                                path: "recurring",
                                element: <RecurringJobs />,
                                loader: recurringJobsLoader(queryClient)
                            }, {
                                path: "recurring/recurring-job-detail/:id",
                                element: <RecurringJobDetail />,
                                loader: recurringJobDetailLoader(queryClient)
                            }
                        ]

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

                    }, {
                        path: "team",
                        element: <Team />,
                        loader: teamLoader(queryClient)
                    },
                    {
                        path: "invoices",
                        element: <Invoices />,
                        loader: invoicesLoader(queryClient),
                        errorElement: <ErrorElement />,
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
                        element: <Analytics />,
                    },
                    {
                        path: "workers/:id/worker-profile",
                        element: <WorkerProfile />,
                    },
                    {
                        // Kept pointing at the real Company Settings page rather
                        // than the new /settings/billing placeholder — that page
                        // has no real content yet, so redirecting here would trade
                        // working billing content for an empty stub.
                        path: "billing",
                        element: <Settings />
                    },
                    {
                        path: "settings",
                        element: <SettingsLayout />,
                        children: [
                            {
                                index: true,
                                element: <Settings />,
                                loader: settingsLoader(queryClient),
                            },
                            { path: "profile", element: <ProfileSettings /> },
                            { path: "company", element: <CompanySettings /> },
                            { path: "notifications", element: <NotificationSettings /> },
                            { path: "security", element: <SecuritySettings /> },
                            { path: "billing", element: <BillingSettings /> },
                        ],
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
                    }, {
                        path: "login",
                        element: <Navigate to={"/auth"} replace />
                    },
                    {
                        path: "signup",
                        element: <SignUpForm />,
                        action: signupAction

                    },
                    {
                        path: "verify-email",
                        element: <VerifyEmailPage />
                    },
                    {
                        path: "forgot-password",
                        element: <ForgotPasswordPage />
                    },
                    {
                        path: "reset-password",
                        element: <ResetPasswordPage />
                    },

                    {
                        path: "*",
                        element: <NotFound />
                    },
                ]
            },

            {
                path: "/invite",
                element: <InvitationLayout />,
                children: [
                    // {
                    //     index: true,
                    //     element: <Navigate to="accept" replace />,
                    // },
                    {
                        path: "accept",
                        element: (
                            <AcceptInvitePage />
                        ),
                    },

                    {
                        path: "new-user",
                        element: (
                            <NewUserInvitePage />
                        ),
                    },

                    {
                        path: "existing-user",
                        element: (
                            <ExistingUserInvitePage />
                        ),
                    },

                    {
                        path: "success",
                        element: (
                            <InvitationSuccessPage />
                        ),
                    },

                    {
                        path: "status/:status",
                        element: (
                            <InvitationStatusPage />
                        ),
                    },
                ],
            },
            {
                path: "worker",
                element: <WorkerAppLayout />,
                loader: workerRouteLoader(queryClient),
                errorElement: <ErrorElement />,
                children: [
                    {
                        index: true,
                        element: <HomeScreen />,
                        // Same query as /worker/profile's loader — reused as-is
                        // so it actually awaits ensureQueryData (workerDashboardstats
                        // itself is just query options, not a loader function).
                        loader: workerProfileLoader
                    },
                    {
                        path: "jobs",
                        element: <WorkerJobLayout />,
                        children: [
                            {
                                index: true,
                                element: <Navigate to={"/worker/jobs/my-jobs"} replace />
                            },
                            {
                                loader: workerLoader(queryClient),
                                path: "my-jobs",
                                element: <JobsScreen />
                            }, {

                                path:"recurring-jobs",
                                element: <RecurringAssignmentPage />,
                                loader: recurringAssignmentsLoader(queryClient)
                            }
                        ]
                    }, {
                        path: "profile",
                        element: <ProfileScreen />,
                        loader: workerProfileLoader
                    },
                    {
                        path: "profile/notifications",
                        element: <NotificationPreferencesScreen />,
                        loader: notificationPreferencesLoader(queryClient)
                    },
                    {
                        path: "profile/edit",
                        element: <EditProfileScreen />
                    },
                    {
                        path: "profile/download-time-sheet",
                        element: <DownloadTimesheetScreen />
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