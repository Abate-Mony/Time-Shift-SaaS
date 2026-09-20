// Shared between main.tsx and ErrorElement.tsx — see ErrorElement.tsx for
// why this exists (a lazy route chunk 404ing against a newer deploy).
export const STALE_CHUNK_RELOAD_GUARD_KEY = "inprn-stale-chunk-reload"

// Called once the app shell has actually booted successfully, so a stale
// chunk error hours from now (a later deploy, same long-lived tab) still
// gets one fresh auto-reload attempt instead of being permanently
// suppressed by a guard set during an earlier, already-resolved incident.
export function clearStaleChunkReloadGuard() {
    try {
        sessionStorage.removeItem(STALE_CHUNK_RELOAD_GUARD_KEY)
    } catch {
        // sessionStorage unavailable (private mode, etc.) — nothing to clear
    }
}
