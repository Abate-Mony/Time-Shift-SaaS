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
import AppearanceSettings from "@/pages/settings/AppearanceSettings";
import BillingSettings from "@/pages/settings/BillingSettings";
import CompanySettings from "@/pages/settings/CompanySettings";
import EmailSettings from "@/pages/settings/EmailSettings";
import InvoicingSettings from "@/pages/settings/InvoicingSettings";
import NotificationSettings from "@/pages/settings/NotificationSettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import SecuritySettings from "@/pages/settings/SecuritySettings";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ClockScreen from "@/pages/worker/ClockScreenPage";
import EditProfileScreen from "@/pages/worker/EditProfile";
import JobDetailScreen from "@/pages/worker/JobDetailspage";
import JobsScreen from "@/pages/worker/JobScreen";
import OpenShiftsPage from "@/pages/worker/OpenShiftsPage";
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
import PublicQuotePage from "@/pages/PublicQuotePage";
import { createBrowserRouter, Navigate } from "react-router";
import DashboardLayout from "../layouts/dashboardlayout";
import { Analytics, analyticsLoader, Calendar, calendarLoader, ClentBillingPage, ClientDetail, clientDetailLoader, ClientDetailsaJobsPage, ClientDetailsContactsPage, ClientDetailsOverviewPage, ClientDetailsSitesPage, Clients, clientsLoader, clockLoader, CreateClientPage, CreateInvoicePage, createInvoiceLoader, CreateJob, createjobAction, CreateQuote, createQuoteLoader, CreateSitePage, Dashboard, dashboardLoader, DownloadTimesheetScreen, EditJob, editJobAction, HelpArticlePage, HelpArticleScreen, HelpCentre, HelpCentreScreen, InvoiceDetail, invoiceDetailLoader, InvoiceForm, invoiceFormLoader, Invoices, invoicesLoader, JobDetail, Jobs, jobsLoader, loginAction, openShiftsLoader, ProfileScreen, Quotes, quotesLoader, RecurringJobDetail, recurringJobDetailLoader, RecurringJobs, recurringJobsLoader, ReportLayout, ReportsOverviewPage, ReportsPayrollPage, ReportsTimesheetsPage, ReportsPerformancePage, ReportsProfitabilityPage, Settings, settingsLoader, signupAction, singleJobLoader, singleWorkerJobLoader, SiteDetailPage, siteDetailLoader, Sites, sitesLoader, SuspendedAccountPage, Team, teamLoader, workerLoader, WorkerProfile, workerProfileLoader, workerStatsLoader, Workers, workersLoader, CheckOutSettings, ChangePlanSettings, Notifications, TeamsCreatepage, teamsCreateLoader, WorkerDocumentsScreen } from "../pages";

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
                    }, {
                        path: "notifications",
                        element: <Notifications />
                    },
                    {
                        path: "create-job",
                        element: <CreateJob />,
                        loader: workersLoader(queryClient),
                        action: createjobAction
                    },
                    {
                        path: "clients",
                        element: <Clients />,
                        loader: clientsLoader(queryClient)
                    },
                    {
                        path: "clients/create",
                        element: <CreateClientPage />,
                    },
                    {
                        path: "clients/:id",
                        element: <ClientDetail />,
                        loader: clientDetailLoader(queryClient),
                        children: [
                            {
                                index: true,
                                element: <Navigate to="overview" replace />
                            },
                            {
                                path: "overview",
                                element: <ClientDetailsOverviewPage />
                            },
                            {
                                path: "contacts",
                                element: <ClientDetailsContactsPage />
                            },
                            {
                                path: "jobs",
                                element: <ClientDetailsaJobsPage />
                            },
                            {
                                path: "sites",
                                element: <ClientDetailsSitesPage />
                            },
                            {
                                path: "billing",
                                // No props passed — it reads the client from
                                // ClientDetail's context, same as the other tabs.
                                element: <ClentBillingPage />
                            }
                        ]
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
                    }, {
                        path: "team/invite",
                        element: <TeamsCreatepage />,
                        loader: teamsCreateLoader(queryClient)
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
                        // The primary create path — pick a client + period,
                        // bill whatever's actually ready. "invoices/new"
                        // above stays reachable for one-off manual invoices.
                        path: "invoices/create",
                        element: <CreateInvoicePage />,
                        loader: createInvoiceLoader(queryClient),
                    },
                    {
                        path: "invoices/:id",
                        element: <InvoiceDetail />,
                        loader: invoiceDetailLoader(queryClient),
                    },
                    {
                        path: "invoices/:id/edit",
                        element: <InvoiceForm />,
                        loader: invoiceFormLoader(queryClient),
                    },
                    {
                        path: "quotes",
                        element: <Quotes />,
                        loader: quotesLoader(queryClient),
                        errorElement: <ErrorElement />,
                    },
                    {
                        // Create, edit-draft and view-sent all share one page —
                        // see CreateQuote.tsx's readOnly logic.
                        path: "quotes/create",
                        element: <CreateQuote />,
                        loader: createQuoteLoader(queryClient),
                    },
                    {
                        path: "quotes/:id",
                        element: <CreateQuote />,
                        loader: createQuoteLoader(queryClient),
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
                        path: "sites",
                        element: <Sites />,
                        loader: sitesLoader(queryClient),
                    },
                    {
                        path: "sites/create",
                        element: <CreateSitePage />,
                    },
                    {
                        path: "sites/:id",
                        element: <SiteDetailPage />,
                        loader: siteDetailLoader(queryClient),
                    },
                    {
                        path: "reports",
                        element: <ReportLayout />,
                        children: [
                            { index: true, element: <ReportsOverviewPage /> },
                            { path: "payroll", element: <ReportsPayrollPage /> },
                            { path: "timesheets", element: <ReportsTimesheetsPage /> },
                            { path: "performance", element: <ReportsPerformancePage /> },
                            { path: "profitability", element: <ReportsProfitabilityPage /> },
                        ],
                    },
                    {
                        // Pre-existing standalone sidebar link — used to render the
                        // same Reports component defaulted to its Overview tab, so
                        // it never actually reached Timesheets. Now that Timesheets
                        // is a real route, send it there directly.
                        path: "timesheets",
                        element: <Navigate to="/reports/timesheets" replace />,
                    },
                    {
                        path: "analytics",
                        element: <Analytics />,
                        loader: analyticsLoader(queryClient),
                        errorElement: <ErrorElement />,
                    },
                    {
                        path: "workers/:id/worker-profile",
                        element: <WorkerProfile />,
                        loader: workerStatsLoader(queryClient),
                        errorElement: <ErrorElement />,
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
                            { path: "appearance", element: <AppearanceSettings /> },
                            { path: "invoicing", element: <InvoicingSettings /> },
                            { path: "security", element: <SecuritySettings /> },
                            { path: "email", element: <EmailSettings /> },
                            { path: "billing", element: <BillingSettings /> },
                            { path: "billing/plans", element: <ChangePlanSettings /> },
                            { path: "billing/checkout", element: <CheckOutSettings /> },
                            {
                                path: "*",

                                element: <NotFound />,

                            }
                        ],
                    },
                    {
                        path: "help",
                        element: <HelpCentre />
                    },
                    {
                        path: "help/:articleSlug",
                        element: <HelpArticlePage />
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
                // No auth, no dashboard chrome — a client opens this straight
                // from an emailed link. Sibling of /invite/auth/worker below,
                // all direct children of the bare RootLayout.
                path: "q/:token",
                element: <PublicQuotePage />,
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

                                path: "recurring-jobs",
                                element: <RecurringAssignmentPage />,
                                loader: recurringAssignmentsLoader(queryClient)
                            }, {
                                path: "open-shifts",
                                element: <OpenShiftsPage />,
                                loader: openShiftsLoader(queryClient)
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
                        path: "profile/documents",
                        element: <WorkerDocumentsScreen />
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
                        path: "help",
                        element: <HelpCentreScreen />
                    },
                    {
                        path: "help/:articleSlug",
                        element: <HelpArticleScreen />
                    },
                    {
                        path: "*",
                        element: <NotFound />
                    }
                ]
            },
            {
                path: "account/suspended",
                element: <SuspendedAccountPage />
            },

            {
                path: "*",
                element: <NotFound />
            },

        ]
    }

]);