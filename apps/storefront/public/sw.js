/* Nemaya service worker — Web Push (VAPID). No Firebase involved. */
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "Nemaya", body: event.data ? event.data.text() : "" }
  }
  const title = data.title || "Nemaya"
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    image: data.image,
    tag: data.tag,
    data: { url: data.url || "/" },
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      // let open tabs refresh their notification bell
      self.clients.matchAll({ type: "window" }).then((clients) => clients.forEach((c) => c.postMessage({ type: "nemaya:push" }))),
    ])
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url === url && "focus" in c) return c.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
