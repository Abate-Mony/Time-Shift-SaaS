/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching"

declare const self: ServiceWorkerGlobalScope

// Injected at build time by vite-plugin-pwa (strategies: "injectManifest")
// with the list of built assets to precache.
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener("push", (event) => {
  let data: { title?: string; body?: string; tag?: string; silent?: boolean; url?: string } = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "TimeShift", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "TimeShift"
  const options: NotificationOptions = {
    body: data.body || "",
    tag: data.tag || "timeshift-notification",
    silent: !!data.silent,
    data: { url: data.url || "/worker/clock" },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Fires when the push service invalidates and silently rotates a
// subscription (expiry, browser-side key rotation, etc). Not all browsers
// send this reliably — the backend also self-heals by pruning subscriptions
// that come back 410 Gone on send, so this is a best-effort top-up, not the
// only safety net.
self.addEventListener("pushsubscriptionchange", (event: any) => {
  const applicationServerKey = event.oldSubscription?.options?.applicationServerKey
  event.waitUntil(
    self.registration.pushManager
      .subscribe(applicationServerKey ? { userVisibleOnly: true, applicationServerKey } : event.oldSubscription.options)
      .then((subscription) =>
        fetch(`${import.meta.env.VITE_API_URL}/workers/push-subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(subscription.toJSON()),
        })
      )
      .catch(() => { })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/worker/clock"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
