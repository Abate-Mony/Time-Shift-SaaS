import { useLocation, useSearchParams } from "react-router"

export interface BackLinkTarget {
  to: string
  label: string
}

/**
 * Static, human-readable origins — short, shareable URLs (`?rd_from=jobs`)
 * for the common case of "came from a list page". These survive a refresh
 * or a shared link, unlike router state. Extend this map (not the call
 * sites) when a new list page starts linking to a detail page.
 */
export const RD_PAGES: Record<string, BackLinkTarget> = {
  jobs: { to: "/jobs", label: "Jobs" },
  dashboard: { to: "/", label: "Dashboard" },
  calendar: { to: "/calendar", label: "Calendar" },
  workers: { to: "/workers", label: "Workers" },
  team: { to: "/team", label: "Team" },
  clients: { to: "/clients", label: "Clients" },
  invoices: { to: "/invoices", label: "Invoices" },
  reports: { to: "/reports", label: "Reports" },
  "recurring-jobs": { to: "/jobs/recurring", label: "Recurring Jobs" },
}

/**
 * Resolves where a detail page's "Back" button should actually go, in order:
 *
 *  1. Router state's `backTo` — set by whichever specific page the user just
 *     clicked from. The only way to return to a DYNAMIC origin (e.g. "the
 *     exact job" a worker profile was opened from, not just "the jobs
 *     list"), and it preserves that origin's own filters/search too, since
 *     it's the real path+querystring, not a bare list root.
 *  2. The `rd_from` query param, looked up in RD_PAGES — a short, shareable
 *     origin key that (unlike state) survives a refresh or a shared link.
 *  3. `fallback`, for a direct visit with neither of the above.
 */
export function useBackLink(fallback: BackLinkTarget): BackLinkTarget {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = location.state as { backTo?: string; backLabel?: string } | null | undefined

  if (state?.backTo) {
    return { to: state.backTo, label: state.backLabel ?? fallback.label }
  }

  const rdFrom = searchParams.get("rd_from")
  if (rdFrom && RD_PAGES[rdFrom]) {
    return RD_PAGES[rdFrom]
  }

  return fallback
}

/** The raw shape `useBackLink` reads back out of router state. */
export interface BackLinkState {
  backTo: string
  backLabel: string
}

/**
 * Router state for a Link/navigate() call into a detail page, so that
 * page's `useBackLink` can send the user back to exactly here — the
 * current full path and querystring, e.g. "the jobs list with my filters
 * still applied" or "this specific job", not just a bare list root.
 *
 * Returns the raw state object — compose it yourself:
 *   navigate(path, { state: backLinkState("Jobs") })
 *   <Link to={path} state={backLinkState("Jobs")}>
 *
 * Pass an explicit `path` when linking from somewhere that isn't the
 * current window location (rare — usually omit it).
 */
export function backLinkState(label: string, path?: string): BackLinkState {
  const to = path ?? (typeof window !== "undefined" ? window.location.pathname + window.location.search : "")
  return { backTo: to, backLabel: label }
}
