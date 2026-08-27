export function isNotificationSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window
}

// Only actually prompts the first time (permission === "default"). If the
// worker already granted or denied it, this just returns that decision —
// browsers won't re-prompt a denied user anyway.
export async function ensureNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) return "denied"
    if (Notification.permission === "default") {
        try {
            return await Notification.requestPermission()
        } catch {
            return "denied"
        }
    }
    return Notification.permission
}
