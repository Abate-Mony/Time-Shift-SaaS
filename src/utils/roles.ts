// "owner" is a strict superset of "admin" (the company founder, plus a few
// owner-only capabilities later) rather than a sibling role like
// manager/worker are to each other — mirrors authorizePermissions' hierarchy
// on the backend. Single source of truth so every "is this an admin-level
// user" check in the app agrees, instead of `role === 'admin'` scattered
// across settings/billing/team pages quietly excluding owners.
export function isAdminRole(role: string | undefined | null): boolean {
    return role === 'admin' || role === 'owner'
}

// A handful of capabilities are owner-only even among admin-level users —
// e.g. connecting a company sending domain (real DNS/email infrastructure,
// not just an app setting). Mirrors authorizePermissions("owner") on the
// backend, which is the actual source of truth this only reflects for UI.
export function isOwnerRole(role: string | undefined | null): boolean {
    return role === 'owner'
}
