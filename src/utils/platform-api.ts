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

export interface PlatformCompanyListItem {
  id: string;
  name: string;
  owner: { id: string; name?: string; email: string } | null;
  plan: Plan;
  workerUsage: { active: number; limit: number | null; unlimited: boolean };
  status: CompanyStatus;
  createdAt: string;
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
}

export interface PlatformEmailSettings {
  provider: "inprn" | "custom";
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
