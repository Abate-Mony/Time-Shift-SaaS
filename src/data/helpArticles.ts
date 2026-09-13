import type { LucideIcon } from "lucide-react"
import {
  Rocket,
  Users,
  Briefcase,
  Clock,
  Building2,
  Receipt,
  BarChart3,
  Settings,
  Timer,
  User as UserIcon,
} from "lucide-react"
import type { UserRole } from "@/utils/types"

export type HelpRole = UserRole

export interface HelpSection {
  heading?: string
  body?: string
  steps?: string[]
  bullets?: string[]
  note?: string
}

export interface HelpCategoryDef {
  id: string
  label: string
  description: string
  icon: LucideIcon
}

export interface HelpArticle {
  slug: string
  title: string
  description: string
  category: string
  roles: HelpRole[]
  keywords: string[]
  content: HelpSection[]
  /** Slugs of other articles to surface as "Related articles". */
  related?: string[]
  /** Optional deep link into the real feature this article documents. */
  link?: { label: string; to: string }
}

// ─── Categories ──────────────────────────────────────────────────────────────
// Two separate sets rather than one shared list — the admin/manager dashboard
// and the worker app are different enough surfaces (and different enough
// audiences) that forcing them into one taxonomy would mean either exposing
// dashboard-only categories to workers or diluting worker categories with
// admin concepts. Worker ids are prefixed so the two sets never collide.

export const ADMIN_HELP_CATEGORIES: HelpCategoryDef[] = [
  { id: "getting-started", label: "Getting Started", description: "Find your way around the dashboard", icon: Rocket },
  { id: "team", label: "Team & Workers", description: "Invite, assign and manage your team", icon: Users },
  { id: "jobs", label: "Jobs & Scheduling", description: "Create, assign and track jobs", icon: Briefcase },
  { id: "timesheets", label: "Timesheets & Attendance", description: "Clock records, overtime and reviews", icon: Clock },
  { id: "clients", label: "Clients", description: "Manage the clients you work for", icon: Building2 },
  { id: "invoices", label: "Invoices", description: "Bill clients for completed work", icon: Receipt },
  { id: "reports", label: "Reports", description: "Payroll and performance analytics", icon: BarChart3 },
  { id: "account", label: "Account & Settings", description: "Your profile, company and billing", icon: Settings },
]

export const WORKER_HELP_CATEGORIES: HelpCategoryDef[] = [
  { id: "w-getting-started", label: "Getting Started", description: "Find your way around the worker app", icon: Rocket },
  { id: "w-jobs", label: "My Jobs & Shifts", description: "View, accept and manage your shifts", icon: Briefcase },
  { id: "w-clocking", label: "Clocking In & Out", description: "Start and finish work, on time", icon: Timer },
  { id: "w-timesheets", label: "Timesheets", description: "Your hours and pay records", icon: Clock },
  { id: "w-account", label: "Account & Troubleshooting", description: "Your profile and common issues", icon: UserIcon },
]

// ─── Articles ────────────────────────────────────────────────────────────────
// Content here describes what the product actually does today — real route
// names, real button labels, real statuses. When a feature is plan-gated or
// role-gated, that's called out rather than glossed over. Keep it that way:
// if you add a topic, check the feature actually exists and works before
// writing the steps.

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Admin / Manager: Getting started ─────────────────────────────────────
  {
    slug: "navigating-your-dashboard",
    title: "Navigating your dashboard",
    description: "A tour of the sidebar, top bar and where everything lives.",
    category: "getting-started",
    roles: ["admin", "manager"],
    keywords: ["dashboard", "sidebar", "navigation", "search", "topbar", "layout"],
    link: { label: "Open Dashboard", to: "/" },
    content: [
      {
        body: "The sidebar on the left is split into two groups: day-to-day operations (Dashboard, Jobs, Workers, Client, Teams, Calendar, Locations) and reporting (Reports, Invoices, Timesheets, Analytics). Your account, settings and this Help Centre live in the bottom section.",
      },
      {
        heading: "Searching from anywhere",
        body: "The search bar at the top of the screen opens a command palette that searches jobs, workers, clients and invoices at once — press ⌘K (or Ctrl+K on Windows) from any page to open it.",
      },
      {
        heading: "Creating things quickly",
        body: "The \"+ New\" button in the top bar opens a menu to jump straight into creating a Job, Invoice or Client without leaving the page you're on.",
      },
      {
        note: "Click your avatar in the top-right corner to reach your Profile, Billing and Settings pages, or to sign out.",
      },
    ],
    related: ["creating-a-job", "inviting-a-team-member"],
  },

  // ── Admin / Manager: Jobs & Scheduling ───────────────────────────────────
  {
    slug: "creating-a-job",
    title: "Creating a job",
    description: "Walk through the job wizard from details to publishing.",
    category: "jobs",
    roles: ["admin", "manager"],
    keywords: ["job", "create", "new job", "wizard", "schedule", "shift"],
    link: { label: "Create a job", to: "/create-job" },
    content: [
      {
        body: "Open Jobs from the sidebar, or use the \"+ New\" menu in the top bar and choose Job. The job wizard walks through five steps: Details, Schedule & Staffing, Billing, Policies and Review.",
      },
      {
        heading: "The five steps",
        steps: [
          "Details — the job title, client and location it's for",
          "Schedule & Staffing — the date, start/end time and how many workers are needed",
          "Billing — the pay rate and (if applicable) what the client is charged",
          "Policies — worker-visible instructions and any clock-in location requirements",
          "Review — check everything, then publish",
        ],
      },
      {
        heading: "Draft vs published",
        body: "You can save a job as a Draft at any point — drafts aren't visible to workers and can be freely edited or discarded. Publishing makes the job visible and assignable.",
      },
      {
        note: "Once a job's shift date has passed, or it's marked Completed or Cancelled, its date, pay and billing fields lock to protect payroll and invoicing records that may already depend on them.",
      },
    ],
    related: ["assigning-workers-to-a-job", "understanding-job-statuses", "recurring-jobs-and-open-shifts"],
  },
  {
    slug: "assigning-workers-to-a-job",
    title: "Assigning workers to a job",
    description: "How workers get added to a job and what they see once assigned.",
    category: "jobs",
    roles: ["admin", "manager"],
    keywords: ["assign", "worker", "staffing", "job", "accept", "decline"],
    content: [
      {
        body: "Workers are assigned during the Schedule & Staffing step of the job wizard, or from a job's own detail page after it's been created.",
      },
      {
        heading: "What happens after assigning",
        body: "An assigned worker receives a notification and sees the job on their worker app. They can Accept or Decline it — declined slots stay open until someone else is assigned.",
      },
      {
        note: "A worker's assignment status (pending, accepted, declined, in progress, completed, cancelled) is separate from the job's own status, since a job can have several workers each at a different stage.",
      },
    ],
    related: ["creating-a-job", "understanding-job-statuses"],
  },
  {
    slug: "understanding-job-statuses",
    title: "Understanding job statuses",
    description: "What Draft, Published, In Progress, Completed and Cancelled mean.",
    category: "jobs",
    roles: ["admin", "manager"],
    keywords: ["status", "draft", "published", "completed", "cancelled", "in progress"],
    content: [
      {
        bullets: [
          "Draft — not yet visible to workers, freely editable",
          "Published — visible and assignable to workers",
          "In Progress — a worker has clocked in and is currently working it",
          "Completed — the shift finished and (once reviewed) is ready for payroll or invoicing",
          "Cancelled — called off before or during the shift",
        ],
      },
      {
        note: "Editing a job's date, pay or billing is blocked once it's Completed, Cancelled, or its shift date is in the past — this stops changes from silently disagreeing with payroll or invoices that already went out.",
      },
    ],
    related: ["creating-a-job", "reviewing-timesheets"],
  },
  {
    slug: "recurring-jobs-and-open-shifts",
    title: "Recurring jobs & open shifts",
    description: "Repeat a schedule automatically, or let workers pick up unfilled shifts.",
    category: "jobs",
    roles: ["admin", "manager"],
    keywords: ["recurring", "repeat", "template", "open shifts", "schedule"],
    link: { label: "Open recurring jobs", to: "/jobs/recurring" },
    content: [
      {
        body: "Recurring Jobs (under Jobs → Recurring) creates a repeating schedule from a single template instead of building each shift by hand. Open Shifts lets workers see and claim unfilled slots themselves rather than waiting to be individually assigned.",
      },
      {
        note: "Both are plan features — if your company's plan doesn't include Recurring job templates or Open shifts & approval workflows, these are hidden or shown as locked until you upgrade.",
      },
    ],
    related: ["creating-a-job", "company-settings-and-billing"],
  },

  // ── Admin / Manager: Team & Workers ──────────────────────────────────────
  {
    slug: "inviting-a-team-member",
    title: "Inviting a team member",
    description: "Send an invite for a Worker, Manager or Admin to join your company.",
    category: "team",
    roles: ["admin", "manager"],
    keywords: ["invite", "team", "add worker", "add manager", "onboarding"],
    link: { label: "Invite a team member", to: "/team/invite" },
    content: [
      {
        body: "Open Teams from the sidebar and select \"Invite team member\". Enter their email, choose a role, and fill in their details (name, phone, pay rate for workers).",
      },
      {
        note: "The number of active workers you can have is limited by your company's plan — once you're at the limit, the Worker role is disabled on the invite form until you free up a slot or upgrade.",
      },
      {
        body: "They'll receive an invite by email. Until they accept it, they show up on the Teams page as a pending invitation, which you can resend or revoke.",
      },
    ],
    related: ["understanding-team-roles", "managing-worker-access"],
  },
  {
    slug: "understanding-team-roles",
    title: "Understanding team roles",
    description: "What Admin, Manager and Worker can each do.",
    category: "team",
    roles: ["admin", "manager"],
    keywords: ["role", "admin", "manager", "worker", "permissions"],
    content: [
      {
        bullets: [
          "Worker — views assigned jobs, accepts or declines shifts, clocks in/out and views their own timesheets",
          "Manager — manages jobs, workers and day-to-day operational activity",
          "Admin — everything a Manager can do, plus company settings and billing",
        ],
      },
      {
        note: "Ownership of the company isn't a separate role — it's tracked independently of Admin, Manager and Worker.",
      },
    ],
    related: ["inviting-a-team-member"],
  },
  {
    slug: "managing-worker-access",
    title: "Managing worker access",
    description: "Suspend, restrict or lift access for a team member, and handle appeals.",
    category: "team",
    roles: ["admin", "manager"],
    keywords: ["suspend", "restrict", "deactivate", "access", "appeal"],
    link: { label: "Open Teams", to: "/team" },
    content: [
      {
        body: "From a team member's row on the Teams page, open the actions menu and choose \"Suspend / restrict\". You can apply one of three access levels:",
      },
      {
        bullets: [
          "Suspended — no access to the app at all",
          "Read only — can view but not act (e.g. can't accept new shifts)",
          "Limited — some actions are restricted, others allowed",
        ],
      },
      {
        body: "A restricted worker can submit an appeal, which shows up for you to review from the same page. Lifting a restriction restores their normal access immediately.",
      },
    ],
    related: ["understanding-team-roles"],
  },

  // ── Admin / Manager: Timesheets & Attendance ─────────────────────────────
  {
    slug: "reviewing-timesheets",
    title: "Reviewing timesheets",
    description: "Where completed shifts and worked hours show up for review.",
    category: "timesheets",
    roles: ["admin", "manager"],
    keywords: ["timesheet", "hours", "payroll", "review"],
    link: { label: "Open Timesheets", to: "/reports/timesheets" },
    content: [
      {
        body: "Timesheets (under Reports → Timesheets) lists worked hours per shift, pulled from each worker's actual clock-in and clock-out times rather than what was originally scheduled.",
      },
      {
        note: "Scheduled duration and actual worked duration are tracked separately — a shift finishing early or running long shows up honestly rather than being capped to what was planned.",
      },
    ],
    related: ["understanding-attendance-records"],
  },
  {
    slug: "understanding-attendance-records",
    title: "Understanding attendance and overtime reviews",
    description: "What clock-in/out records show, and how to review flagged overtime.",
    category: "timesheets",
    roles: ["admin", "manager"],
    keywords: ["clock in", "clock out", "attendance", "overtime", "geofence", "location"],
    content: [
      {
        body: "Every clock-in and clock-out is timestamped, and if the job has a location check enabled, whether the worker was inside the required radius.",
      },
      {
        note: "A location flag is a review aid, not automatic proof of misconduct — it just tells you the worker's device wasn't inside the radius at that moment.",
      },
      {
        heading: "Reviewing overtime",
        body: "When a worker's actual time runs over what was scheduled, it's flagged for review on the job's detail page (in the \"Approve & Complete\" flow). For each flagged worker you can approve the extra time as-is, adjust it, or reject it — worker by worker.",
      },
    ],
    related: ["reviewing-timesheets", "creating-a-job"],
  },

  // ── Admin / Manager: Clients ──────────────────────────────────────────────
  {
    slug: "creating-and-managing-clients",
    title: "Creating and managing clients",
    description: "Add a client and see their jobs, contacts and billing in one place.",
    category: "clients",
    roles: ["admin", "manager"],
    keywords: ["client", "customer", "create client", "contacts"],
    link: { label: "Open Clients", to: "/clients" },
    content: [
      {
        body: "Open Clients from the sidebar and select \"Create Client\" to add one — you'll need at minimum a name, and can add contacts and site details.",
      },
      {
        body: "A client's detail page has tabs for Overview, Contacts, Jobs and Billing, so you can see every job run for them and their invoicing history without leaving the page.",
      },
    ],
    related: ["understanding-invoices", "creating-a-job"],
  },

  // ── Admin / Manager: Invoices ─────────────────────────────────────────────
  {
    slug: "understanding-invoices",
    title: "Understanding invoices",
    description: "Invoice statuses, and how to create and settle one.",
    category: "invoices",
    roles: ["admin", "manager"],
    keywords: ["invoice", "billing", "paid", "overdue", "draft"],
    link: { label: "Open Invoices", to: "/invoices" },
    content: [
      {
        bullets: [
          "Draft — being prepared, only draft invoices can still be edited",
          "Sent — issued to the client",
          "Overdue — sent, past its due date and still unpaid",
          "Paid — settled",
        ],
      },
      {
        heading: "Creating one",
        body: "From Invoices, choose a client and billing period to automatically pull in the completed, billable work for that client. A blank invoice is also available for one-off charges.",
      },
      {
        heading: "Marking paid",
        body: "Once a client has paid, open the invoice and select \"Mark as Paid\".",
      },
    ],
    related: ["creating-and-managing-clients"],
  },

  // ── Admin / Manager: Reports ───────────────────────────────────────────────
  {
    slug: "reports-overview",
    title: "Navigating reports",
    description: "What each report tab covers, and where the numbers come from.",
    category: "reports",
    roles: ["admin", "manager"],
    keywords: ["reports", "payroll", "performance", "profitability", "analytics"],
    link: { label: "Open Reports", to: "/reports" },
    content: [
      {
        bullets: [
          "Overview — a snapshot of activity for the selected month",
          "Payroll — worked hours and pay by worker",
          "Timesheets — individual clock-in/out records",
          "Performance — worker-level trends (requires an Advanced reports plan)",
          "Profitability — job and client margins (requires an Advanced reports plan)",
        ],
      },
      {
        note: "Performance and Profitability are locked on plans without Advanced reports & analytics — you'll see an upgrade prompt instead of the data.",
      },
    ],
    related: ["reviewing-timesheets", "company-settings-and-billing"],
  },

  // ── Admin / Manager: Account & Settings ──────────────────────────────────
  {
    slug: "managing-your-account",
    title: "Managing your account and settings",
    description: "Your profile, notification preferences and security options.",
    category: "account",
    roles: ["admin", "manager"],
    keywords: ["profile", "settings", "account", "password", "notifications"],
    link: { label: "Open Settings", to: "/settings" },
    content: [
      {
        body: "Settings covers your personal Profile, Notification preferences and Security. Click your avatar in the top-right, or open Settings from the sidebar.",
      },
      {
        note: "Sign out from the account menu under your avatar.",
      },
    ],
  },
  {
    slug: "company-settings-and-billing",
    title: "Company settings and billing",
    description: "Company-wide settings and your subscription plan (Admins only).",
    category: "account",
    roles: ["admin"],
    keywords: ["company", "settings", "billing", "plan", "subscription", "upgrade"],
    link: { label: "Open Company Settings", to: "/settings/company" },
    content: [
      {
        body: "Company Settings and Billing are only visible to Admins — Managers see a restricted message if they try to open them directly.",
      },
      {
        heading: "Billing",
        body: "Settings → Billing shows your current plan, its included features (like GPS clock-in verification, Recurring job templates, Open shifts, or Advanced reports & analytics) and your worker limit. \"Change Plan\" opens the full plan comparison to upgrade or downgrade.",
      },
    ],
    related: ["inviting-a-team-member", "recurring-jobs-and-open-shifts"],
  },

  // ── Worker: Getting started ───────────────────────────────────────────────
  {
    slug: "navigating-worker-dashboard",
    title: "Navigating the worker app",
    description: "A tour of Home, Jobs, Clock, Schedule and Profile.",
    category: "w-getting-started",
    roles: ["worker"],
    keywords: ["worker", "dashboard", "home", "navigation"],
    link: { label: "Open Home", to: "/worker" },
    content: [
      {
        body: "The bottom bar is how you get around: Home for a quick overview, Jobs for everything assigned to you, Clock to start or finish a shift, Schedule for your upcoming week, and Profile for your account and stats.",
      },
    ],
    related: ["viewing-your-assigned-jobs", "starting-work-clocking-in"],
  },

  // ── Worker: My Jobs & Shifts ──────────────────────────────────────────────
  {
    slug: "viewing-your-assigned-jobs",
    title: "Viewing your assigned jobs",
    description: "Where to find jobs you've been assigned, and what each status means.",
    category: "w-jobs",
    roles: ["worker"],
    keywords: ["jobs", "shifts", "assigned", "pending", "status"],
    link: { label: "Open My Jobs", to: "/worker/jobs/my-jobs" },
    content: [
      {
        body: "My Jobs lists everything assigned to you. Open Shifts (if enabled by your company) shows unfilled shifts you can pick up yourself, and Recurring shows any repeating schedule you're part of.",
      },
      {
        bullets: [
          "Pending — waiting on you to Accept or Decline",
          "Accepted — confirmed, upcoming",
          "In progress — you're currently clocked in",
          "Completed — the shift is finished",
          "Cancelled — called off",
        ],
      },
    ],
    related: ["accepting-or-declining-a-job", "starting-work-clocking-in"],
  },
  {
    slug: "accepting-or-declining-a-job",
    title: "Accepting or declining a job",
    description: "Confirm a shift you can work, or free it up for someone else.",
    category: "w-jobs",
    roles: ["worker"],
    keywords: ["accept", "decline", "shift", "job"],
    content: [
      {
        body: "Open the job from My Jobs and use the Accept or Decline buttons. Declining frees the slot so it can be offered to or picked up by someone else — it doesn't affect any of your other shifts.",
      },
    ],
    related: ["cancelling-an-accepted-shift"],
  },
  {
    slug: "cancelling-an-accepted-shift",
    title: "Cancelling an accepted shift",
    description: "What to do if you can no longer work a shift you already accepted.",
    category: "w-jobs",
    roles: ["worker"],
    keywords: ["cancel", "shift", "accepted"],
    content: [
      {
        body: "Open the job and select \"Cancel Shift\". You'll be asked for a reason before it's confirmed — cancelling removes you from the assignment so it can be reassigned.",
      },
    ],
    related: ["accepting-or-declining-a-job"],
  },

  // ── Worker: Clocking in & out ─────────────────────────────────────────────
  {
    slug: "starting-work-clocking-in",
    title: "Starting work / clocking in",
    description: "How to clock in for an accepted shift.",
    category: "w-clocking",
    roles: ["worker"],
    keywords: ["clock in", "start work", "shift"],
    link: { label: "Open Clock", to: "/worker/clock" },
    content: [
      {
        body: "On the day of an accepted shift, open Clock and select \"Start Working Job\". This records your clock-in time and switches the job to in progress.",
      },
    ],
    related: ["finishing-your-shift", "location-checks-when-clocking-in"],
  },
  {
    slug: "finishing-your-shift",
    title: "Clocking out",
    description: "How to finish a shift once your work is done.",
    category: "w-clocking",
    roles: ["worker"],
    keywords: ["clock out", "finish work", "finish shift"],
    content: [
      {
        body: "From the Clock screen while a shift is running, select \"Finish Work\" (or \"Finish Shift Instead\" if you need to end it early). This records your clock-out time.",
      },
      {
        note: "Your actual worked time is recorded as-is — it isn't capped to your scheduled hours, so finishing early or running long both show up accurately on your timesheet.",
      },
    ],
    related: ["starting-work-clocking-in", "viewing-your-timesheets"],
  },
  {
    slug: "location-checks-when-clocking-in",
    title: "Location checks when clocking in",
    description: "What happens if a job requires you to be on site to clock in.",
    category: "w-clocking",
    roles: ["worker"],
    keywords: ["location", "gps", "geofence", "permission"],
    content: [
      {
        body: "Some jobs require location access to clock in. Depending on how the job is set up:",
      },
      {
        bullets: [
          "No location check — you can clock in from anywhere",
          "Record and flag — you can always clock in, but it's flagged for your manager if you were off site",
          "Require on site — clocking in outside the job's location is blocked; your manager can override this if needed",
        ],
      },
      {
        note: "If you're prompted for location permission, allow it — without it, a job set to \"Require on site\" won't let you clock in at all.",
      },
    ],
    related: ["starting-work-clocking-in"],
  },

  // ── Worker: Timesheets ────────────────────────────────────────────────────
  {
    slug: "viewing-your-timesheets",
    title: "Viewing your timesheets",
    description: "Where to see your worked hours and download a record of them.",
    category: "w-timesheets",
    roles: ["worker"],
    keywords: ["timesheet", "hours", "download", "pay"],
    link: { label: "Download timesheet", to: "/worker/profile/download-time-sheet" },
    content: [
      {
        body: "Your Profile screen shows a summary of hours worked, jobs completed and earnings for the current month. \"Download Timesheet\" gives you a copy of your worked hours to keep.",
      },
    ],
    related: ["finishing-your-shift"],
  },

  // ── Worker: Account & Troubleshooting ─────────────────────────────────────
  {
    slug: "notification-preferences",
    title: "Notification preferences",
    description: "Control which job alerts and reminders you get.",
    category: "w-account",
    roles: ["worker"],
    keywords: ["notifications", "alerts", "reminders", "preferences"],
    link: { label: "Open Notification Preferences", to: "/worker/profile/notifications" },
    content: [
      {
        body: "From Profile, open \"Notification Preferences\" to choose which job alerts and reminders you receive.",
      },
    ],
  },
  {
    slug: "managing-your-worker-account",
    title: "Managing your worker account",
    description: "Update your profile details or sign out.",
    category: "w-account",
    roles: ["worker"],
    keywords: ["profile", "edit", "logout", "sign out", "account"],
    link: { label: "Edit Profile", to: "/worker/profile/edit" },
    content: [
      {
        body: "Open Profile and select \"Edit Profile\" to update your details. Sign out from the logout option at the bottom of the Profile screen.",
      },
      {
        note: "If a job or feature you expect to see is missing, check with your manager — access to some features depends on your company's plan or on restrictions placed on your account.",
      },
    ],
    related: ["navigating-worker-dashboard"],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isWorker = (role: HelpRole) => role === "worker"

export function getCategoriesForRole(role: HelpRole): HelpCategoryDef[] {
  const all = isWorker(role) ? WORKER_HELP_CATEGORIES : ADMIN_HELP_CATEGORIES
  const visibleArticles = getArticlesForRole(role)
  return all.filter(cat => visibleArticles.some(a => a.category === cat.id))
}

export function getArticlesForRole(role: HelpRole): HelpArticle[] {
  return HELP_ARTICLES.filter(a => a.roles.includes(role))
}

export function getArticlesByCategory(role: HelpRole, categoryId: string): HelpArticle[] {
  return getArticlesForRole(role).filter(a => a.category === categoryId)
}

export function getArticleBySlug(role: HelpRole, slug: string): HelpArticle | undefined {
  return getArticlesForRole(role).find(a => a.slug === slug)
}

export function getCategoryLabel(role: HelpRole, categoryId: string): string {
  const all = isWorker(role) ? WORKER_HELP_CATEGORIES : ADMIN_HELP_CATEGORIES
  return all.find(c => c.id === categoryId)?.label ?? categoryId
}

/**
 * Simple client-side search across title, description, category label and
 * keywords — good enough for a documentation set this size. Ranks title
 * matches above description/keyword-only matches.
 */
export function searchHelpArticles(role: HelpRole, query: string): HelpArticle[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return getArticlesForRole(role)
    .map(article => {
      const title = article.title.toLowerCase()
      const inTitle = title.includes(q)
      const inDescription = article.description.toLowerCase().includes(q)
      const inCategory = getCategoryLabel(role, article.category).toLowerCase().includes(q)
      const inKeywords = article.keywords.some(k => k.toLowerCase().includes(q))
      const inBody = article.content.some(s =>
        s.body?.toLowerCase().includes(q) ||
        s.heading?.toLowerCase().includes(q) ||
        s.bullets?.some(b => b.toLowerCase().includes(q)) ||
        s.steps?.some(s2 => s2.toLowerCase().includes(q))
      )
      const matches = inTitle || inDescription || inCategory || inKeywords || inBody
      const rank = inTitle ? 3 : inDescription || inKeywords ? 2 : inCategory || inBody ? 1 : 0
      return { article, matches, rank }
    })
    .filter(r => r.matches)
    .sort((a, b) => b.rank - a.rank)
    .map(r => r.article)
}

export function getRelatedArticles(article: HelpArticle, role: HelpRole): HelpArticle[] {
  const visible = getArticlesForRole(role)
  const bySlug = article.related
    ?.map(slug => visible.find(a => a.slug === slug))
    .filter((a): a is HelpArticle => !!a) ?? []

  if (bySlug.length > 0) return bySlug.slice(0, 4)

  return visible.filter(a => a.category === article.category && a.slug !== article.slug).slice(0, 4)
}
