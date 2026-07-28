import type z from "zod";
import type { createJobSchema } from "./schemas";

export type UserRole = "admin" | "manager" | "worker";

export type User = {
  _id: string;
  email: string;
  fullname: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
};
export type CreateJobForm = z.infer<typeof createJobSchema>;