import { useQuery } from "@tanstack/react-query"
import { userQuery } from "@/layouts/dashboardlayout"

/**
 * What the signed-in platform admin may change. Mirrors the backend's
 * per-route checks in platformRouter.ts — this only hides buttons; the
 * server still enforces every rule.
 *   support: super_admin, support_admin  (notes, resets, support access)
 *   billing: super_admin, billing_admin  (plans, trials, payments)
 *   super:   super_admin                 (destructive, platform access)
 */
export function usePlatformPermissions() {
  const { data } = useQuery(userQuery)
  const role = (data?.user as { platformRole?: string | null } | undefined)?.platformRole ?? null
  return {
    role,
    canSupport: role === "super_admin" || role === "support_admin",
    canBilling: role === "super_admin" || role === "billing_admin",
    isSuper: role === "super_admin",
  }
}
