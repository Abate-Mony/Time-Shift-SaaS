import customFetch from "./customFetch"

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
    const rawData = atob(base64)
    const output = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i++) {
        output[i] = rawData.charCodeAt(i)
    }
    return output
}

export function isPushSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
}

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null

function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    registrationPromise ??= navigator.serviceWorker.register("/sw.js")
    return registrationPromise
}

// Idempotent — only actually subscribes (and POSTs) once per device; safe to
// call every time there's an active job. Requires Notification permission to
// already be granted, and does nothing if VAPID_PUBLIC_KEY isn't configured
// yet (push notifications aren't wired up on the backend).
export async function ensurePushSubscription(): Promise<void> {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) return
    if (Notification.permission !== "granted") return

    const registration = await registerServiceWorker()
    const existing = await registration.pushManager.getSubscription()
    if (existing) return

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    await customFetch.post("/workers/push-subscription", subscription.toJSON())
}
