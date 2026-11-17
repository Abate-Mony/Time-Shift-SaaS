// Client for the /platform/* backend module (src/controllers/platformController.ts
// in time_sheet_server). Every mutation here requires a `reason` and is
// server-side audited — see recordPlatformAudit on the backend.
import customFetch from "./customFetch";

export type CompanyStatus = "active" | "suspended" | "disabled";
export type Plan = "free" | "starter" | "professional" | "enterprise";

export interface PlatformPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type HealthLevel = "healthy" | "watch" | "at_risk";
export type PlatformTag = "vip" | "at_risk" | "beta" | "partner" | "churned" | "needs_follow_up";

export interface PlatformCompanyListItem {
  id: string;
  name: string;
  owner: { id: string; name?: string; email: string } | null;
  plan: Plan;
  workerUsage: { active: number; limit: number | null; unlimited: boolean };
  status: CompanyStatus;
  tags: PlatformTag[];
  health: { level: HealthLevel; score: number; reasons: string[] } | null;
  deletionScheduledAt: string | null;
  createdAt: string;
}

export interface CompanyHealth {
  level: HealthLevel;
  score: number;
  reasons: string[];
  signals: {
    createdAt: string;
    lastManagerLoginAt: string | null;
    jobsLast30Days: number;
    activeWorkers: number;
    subscriptionStatus: string | null;
    onboarding: { firstJob: boolean; workerInvited: boolean; firstInvoice: boolean };
  };
}

export interface PlatformCompanyDetail {
  id: string;
  name: string;
  businessType?: string;
  size?: string;
  country?: string;
  owner: { id: string; name?: string; email: string } | null;
  plan: Plan;
  workerUsage: { active: number; limit: number | null; unlimited: boolean };
  status: CompanyStatus;
  email: { domainStatus: "not_connected" | "pending" | "verified" | "failed" };
  counts: {
    workers: number; managers: number; admins: number;
    clients: number; sites: number; jobs: number; quotes: number; invoices: number;
  };
  tags: PlatformTag[];
  featureFlags: string[];
  health: CompanyHealth | null;
  billing: {
    stripeCustomerId: string | null;
    stripeDashboardUrl: string | null;
    subscriptionStatus: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    trialEndsAt: string | null;
  };
  deletionScheduledAt: string | null;
  createdAt: string;
}

export interface PlatformCompanyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  platformRole: string | null;
  accountStatus: "active" | "disabled";
  lastActive: string | null;
  createdAt: string;
}

export interface PlatformUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  platformRole: string | null;
  company: { id: string; name: string } | null;
  accountStatus: "active" | "disabled";
  createdAt: string;
}

export interface PlatformUserDetail extends PlatformUserListItem {
  lastLoginAt: string | null;
  isVerified: boolean;
  phone: string | null;
  sessions: { createdAt: string | null; expiresAt: string }[];
  push: { web: number; mobile: number; lastNotification: { title: string; createdAt: string } | null };
  possibleDuplicates: { id: string; name: string; email: string; company: { id: string; name: string } | null }[];
}

export interface PlatformEmailSettings {
  provider: "onclockly" | "custom";
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  sendingDomain: string;
  domainStatus: "not_connected" | "pending" | "verified" | "failed";
  verifiedAt: string | null;
  lastVerificationCheckAt: string | null;
}

export interface PlatformUsage {
  workerSeats: { active: number; limit: number | null; unlimited: boolean };
  jobsThisMonth: number;
  quotesThisMonth: number;
  invoicesThisMonth: number;
}

export interface PlatformAuditListItem {
  id: string;
  actorEmail: string;
  actorPlatformRole: string;
  action: string;
  targetType: string;
  targetId: string;
  company: string | null;
  result: "success" | "failed" | "denied";
  reason: string | null;
  createdAt: string;
}

export interface PlatformAuditDetail extends PlatformAuditListItem {
  actor: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  source: { ip: string | null; userAgent: string | null };
}

export interface PlatformOverview {
  companies: { total: number; active: number; newThisMonth: number };
  users: { activeWorkers: number };
  subscriptions: null;
  trials: null;
  email: { verifiedDomains: number; failedDomains: number };
  attention: Array<{ type: string; severity: "warning"; company: { id: string; name: string }; message: string }>;
  recentActivity: Array<{
    id: string; action: string; actorEmail: string; targetType: string; targetId: string;
    company: string | null; result: string; createdAt: string;
  }>;
}

// ── Overview / System ───────────────────────────────────────────────────

export const platformOverviewQuery = {
  queryKey: ["platform", "overview"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; overview: PlatformOverview }>("/platform/overview");
    return data.overview;
  },
};

export const platformSystemQuery = {
  queryKey: ["platform", "system"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; system: { api: { status: string }; database: { status: string } } }>(
      "/platform/system"
    );
    return data.system;
  },
};

// ── Companies ────────────────────────────────────────────────────────────

export const platformCompaniesQuery = (params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "companies", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformCompanyListItem[]; pagination: PlatformPagination }>(
      "/platform/companies",
      { params }
    );
    return data;
  },
});

export const platformCompanyDetailQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; company: PlatformCompanyDetail }>(`/platform/companies/${companyId}`);
    return data.company;
  },
});

export const platformCompanyUsersQuery = (companyId: string, params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "companies", companyId, "users", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformCompanyUser[]; pagination: PlatformPagination }>(
      `/platform/companies/${companyId}/users`,
      { params }
    );
    return data;
  },
});

export const platformCompanyUsageQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId, "usage"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; usage: PlatformUsage }>(`/platform/companies/${companyId}/usage`);
    return data.usage;
  },
});

export const platformCompanyEmailQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId, "email"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; settings: PlatformEmailSettings }>(`/platform/companies/${companyId}/email`);
    return data.settings;
  },
});

export const updateCompanyStatus = async (companyId: string, status: CompanyStatus, reason: string) => {
  const { data } = await customFetch.patch<{ success: true }>(`/platform/companies/${companyId}/status`, { status, reason });
  return data;
};

export const updateCompanyPlanOverride = async (companyId: string, plan: Plan, reason: string) => {
  const { data } = await customFetch.patch<{ success: true }>(`/platform/companies/${companyId}/plan`, { plan, reason });
  return data;
};

export const retryEmailDomainVerification = async (companyId: string) => {
  const { data } = await customFetch.post<{ success: true; settings: PlatformEmailSettings }>(
    `/platform/email-domains/${companyId}/retry-verification`
  );
  return data.settings;
};

export const resetEmailDomain = async (companyId: string, reason: string) => {
  const { data } = await customFetch.post<{ success: true; settings: PlatformEmailSettings }>(
    `/platform/email-domains/${companyId}/reset`,
    { reason }
  );
  return data.settings;
};

// ── Users ────────────────────────────────────────────────────────────────

export const platformUsersQuery = (params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "users", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformUserListItem[]; pagination: PlatformPagination }>(
      "/platform/users",
      { params }
    );
    return data;
  },
});

export const platformUserDetailQuery = (userId: string) => ({
  queryKey: ["platform", "users", userId],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; user: PlatformUserDetail }>(`/platform/users/${userId}`);
    return data.user;
  },
});

export const updateUserStatus = async (userId: string, status: "active" | "disabled", reason: string) => {
  const { data } = await customFetch.patch<{ success: true }>(`/platform/users/${userId}/status`, { status, reason });
  return data;
};

// ── Audit ────────────────────────────────────────────────────────────────

export const platformAuditQuery = (params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "audit", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformAuditListItem[]; pagination: PlatformPagination }>(
      "/platform/audit",
      { params }
    );
    return data;
  },
});

export const platformAuditDetailQuery = (eventId: string) => ({
  queryKey: ["platform", "audit", "detail", eventId],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; event: PlatformAuditDetail }>(`/platform/audit/${eventId}`);
    return data.event;
  },
});

// ── Scheduled jobs (cron health) ────────────────────────────────────────

export type CronJobStatus = "success" | "failed" | "running" | "never_run";

export interface PlatformCronJob {
  name: string;
  label: string;
  schedule: string;
  lastRunAt: string | null;
  lastFinishedAt: string | null;
  lastStatus: CronJobStatus;
  lastDurationMs: number | null;
  lastError: string | null;
  lastTriggeredBy: "schedule" | "manual" | null;
  runCount: number;
  failCount: number;
}

export const platformCronQuery = {
  queryKey: ["platform", "cron"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformCronJob[] }>("/platform/cron");
    return data.data;
  },
};

export const runPlatformCronJob = async (name: string) => {
  const { data } = await customFetch.post<{ success: boolean; msg: string }>(`/platform/cron/${name}/run`);
  return data;
};

// ── Error log (webhook / email / cron failures) ─────────────────────────

export type PlatformErrorSource = "stripe_webhook" | "email" | "cron";

export interface PlatformErrorLogItem {
  id: string;
  source: PlatformErrorSource;
  message: string;
  metadata: unknown;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export const platformErrorsQuery = (params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "errors", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformErrorLogItem[]; pagination: PlatformPagination }>(
      "/platform/errors",
      { params }
    );
    return data;
  },
});

export const resolvePlatformError = async (errorId: string) => {
  const { data } = await customFetch.patch<{ success: true }>(`/platform/errors/${errorId}/resolve`);
  return data;
};

// ── Platform admins ──────────────────────────────────────────────────────

export type PlatformRole = "super_admin" | "support_admin" | "billing_admin";

export interface PlatformAdminListItem {
  id: string;
  name: string;
  email: string;
  platformRole: PlatformRole;
  createdAt: string;
}

export const platformAdminsQuery = (params: Record<string, string | undefined>) => ({
  queryKey: ["platform", "admins", params],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformAdminListItem[]; pagination: PlatformPagination }>(
      "/platform/admins",
      { params }
    );
    return data;
  },
});

export const grantPlatformAdmin = async (email: string, role: PlatformRole, reason: string) => {
  const { data } = await customFetch.post<{ success: true; admin: PlatformAdminListItem }>("/platform/admins/grant", {
    email,
    role,
    reason,
  });
  return data;
};

export const revokePlatformAdmin = async (userId: string, reason: string) => {
  const { data } = await customFetch.post<{ success: true }>(`/platform/admins/${userId}/revoke`, { reason });
  return data;
};

// ── Announcements ─────────────────────────────────────────────────────────

export type AnnouncementSeverity = "info" | "warning" | "critical";
export type AnnouncementAudience = "all" | "plan" | "company";

export interface PlatformAnnouncementItem {
  id: string;
  message: string;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  targetPlans: Plan[];
  targetCompanies: string[];
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export const platformAnnouncementsQuery = {
  queryKey: ["platform", "announcements"],
  queryFn: async () => {
    const { data } = await customFetch.get<{ success: true; data: PlatformAnnouncementItem[] }>("/platform/announcements");
    return data.data;
  },
};

export interface CreateAnnouncementInput {
  message: string;
  severity: AnnouncementSeverity;
  audience: AnnouncementAudience;
  targetPlans?: Plan[];
  targetCompanies?: string[];
  endsAt?: string | null;
}

export const createPlatformAnnouncement = async (input: CreateAnnouncementInput) => {
  const { data } = await customFetch.post<{ success: true; id: string }>("/platform/announcements", input);
  return data;
};

export const setPlatformAnnouncementActive = async (announcementId: string, isActive: boolean) => {
  const { data } = await customFetch.patch<{ success: true }>(`/platform/announcements/${announcementId}`, { isActive });
  return data;
};

// ── Support tools (platformSupportController.ts on the backend) ──────────

const post = async <T = { success: true; msg?: string }>(url: string, body?: unknown) => (await customFetch.post<T>(url, body)).data;
const patch = async <T = { success: true; msg?: string }>(url: string, body?: unknown) => (await customFetch.patch<T>(url, body)).data;

export interface FeatureFlagDef { key: string; label: string; description: string }

export const platformFeatureFlagsQuery = {
  queryKey: ["platform", "feature-flags"],
  queryFn: async () => (await customFetch.get<{ success: true; data: FeatureFlagDef[]; tags: PlatformTag[] }>("/platform/feature-flags")).data,
  staleTime: Infinity,
};

export interface PlatformNote { id: string; body: string; author: { id: string; email: string }; createdAt: string }

export const platformCompanyNotesQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId, "notes"],
  queryFn: async () => (await customFetch.get<{ success: true; data: PlatformNote[] }>(`/platform/companies/${companyId}/notes`)).data.data,
});
export const addCompanyNote = (companyId: string, body: string) => post(`/platform/companies/${companyId}/notes`, { body });
export const deleteCompanyNote = async (companyId: string, noteId: string) =>
  (await customFetch.delete(`/platform/companies/${companyId}/notes/${noteId}`)).data;
export const updateCompanyTags = (companyId: string, tags: PlatformTag[]) => patch(`/platform/companies/${companyId}/tags`, { tags });

export const extendCompanyTrial = (companyId: string, days: number, reason: string) =>
  post(`/platform/companies/${companyId}/trial/extend`, { days, reason });
export const retryCompanyPayment = (companyId: string, reason: string) =>
  post(`/platform/companies/${companyId}/billing/retry-payment`, { reason });
export const updateCompanyFeatureFlags = (companyId: string, flags: string[], reason: string) =>
  patch(`/platform/companies/${companyId}/feature-flags`, { flags, reason });

export interface PlatformApiKey {
  id: string; name: string; keyPrefix: string; isActive: boolean;
  lastUsedAt: string | null; createdAt: string; revokedAt: string | null;
}
export const platformCompanyApiKeysQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId, "api-keys"],
  queryFn: async () =>
    (await customFetch.get<{ success: true; data: PlatformApiKey[] }>(`/platform/companies/${companyId}/api-keys`)).data.data,
});
export const revokeCompanyApiKey = (companyId: string, keyId: string, reason: string) =>
  post(`/platform/companies/${companyId}/api-keys/${keyId}/revoke`, { reason });

export interface SupportSession { id: string; reason: string; expiresAt: string; createdAt: string; ownerNotified: boolean }
export const platformSupportAccessQuery = (companyId: string) => ({
  queryKey: ["platform", "companies", companyId, "support-access"],
  queryFn: async () =>
    (await customFetch.get<{ success: true; session: SupportSession | null }>(`/platform/companies/${companyId}/support-access`)).data.session,
});
export const startSupportAccess = (companyId: string, reason: string, minutes: 15 | 30 | 60, notifyOwner: boolean) =>
  post<{ success: true; session: SupportSession }>(`/platform/companies/${companyId}/support-access`, { reason, minutes, notifyOwner });
export const endSupportAccess = (companyId: string) => post(`/platform/companies/${companyId}/support-access/end`);

export interface SupportJob {
  id: string; title: string; date: string; startTime: string; endTime: string; status: string;
  location?: string; requiredWorkers?: number; client: string | null;
  workers: { name: string; status: string; clockIn: string | null; clockOut: string | null }[];
}
export interface SupportInvoice { id: string; number: string; client: string | null; total: number; status: string; dueDate: string | null; createdAt: string }

export const platformSupportJobsQuery = (companyId: string, sessionId: string | undefined, from: string, to: string) => ({
  queryKey: ["platform", "companies", companyId, "support", "jobs", sessionId, from, to],
  queryFn: async () =>
    (await customFetch.get<{ success: true; data: SupportJob[] }>(`/platform/companies/${companyId}/support/jobs`, { params: { from, to } })).data.data,
  enabled: !!sessionId,
});
export const platformSupportInvoicesQuery = (companyId: string, sessionId: string | undefined) => ({
  queryKey: ["platform", "companies", companyId, "support", "invoices", sessionId],
  queryFn: async () =>
    (await customFetch.get<{ success: true; data: SupportInvoice[] }>(`/platform/companies/${companyId}/support/invoices`)).data.data,
  enabled: !!sessionId,
});

/** Downloads the company's data export as a .json file. */
export const exportCompanyData = async (companyId: string, reason: string) => {
  const res = await customFetch.post(`/platform/companies/${companyId}/export`, { reason }, { responseType: "blob" });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `company-${companyId}-export.json`;
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};
export const scheduleCompanyDeletion = (companyId: string, confirmName: string, reason: string) =>
  post(`/platform/companies/${companyId}/deletion`, { confirmName, reason });
export const cancelCompanyDeletion = async (companyId: string, reason: string) =>
  (await customFetch.delete(`/platform/companies/${companyId}/deletion`, { data: { reason } })).data;

export const sendUserPasswordReset = (userId: string, reason: string) => post(`/platform/users/${userId}/password-reset`, { reason });
export const resendUserVerification = (userId: string, reason: string) => post(`/platform/users/${userId}/resend-verification`, { reason });
export const changeUserEmail = (userId: string, email: string, reason: string) => patch(`/platform/users/${userId}/email`, { email, reason });
export const revokeUserSessions = (userId: string, reason: string) => post(`/platform/users/${userId}/sign-out-everywhere`, { reason });
export const sendUserTestNotification = (userId: string) => post(`/platform/users/${userId}/test-notification`);
export const moveUserCompany = (userId: string, companyId: string, reason: string) => patch(`/platform/users/${userId}/company`, { companyId, reason });
export const anonymiseUser = (userId: string, confirmEmail: string, reason: string) =>
  post(`/platform/users/${userId}/anonymise`, { confirmEmail, reason });

/** Shows the server's error message from a failed platform call. */
export const platformErrorMessage = (err: unknown, fallback: string) =>
  (err as any)?.response?.data?.msg ?? (err as any)?.response?.data?.message ?? fallback;
