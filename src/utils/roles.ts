// "owner" is a strict superset of "admin" (the company founder, plus a few
// owner-only capabilities later) rather than a sibling role like
// manager/worker are to each other — mirrors authorizePermissions' hierarchy
// on the backend. Single source of truth so every "is this an admin-level
// user" check in the app agrees, instead of `role === 'admin'` scattered
// across settings/billing/team pages quietly excluding owners.
export function isAdminRole(role: string | undefined | null): boolean {
    return role === 'admin' || role === 'owner'
}
