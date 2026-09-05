/* Momentum — arka plan bildirim service worker'ı (yalnızca push için). */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp(Object.fromEntries(new URL(self.location).searchParams));
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const isOngoing = data.kind === "ongoing";
  self.registration.showNotification(data.title || "Momentum", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: isOngoing ? "momentum-ongoing" : data.tag || "momentum",
    renotify: !isOngoing,
    silent: isOngoing,
    vibrate: isOngoing ? [] : [80, 40, 80],
    requireInteraction: isOngoing,
    timestamp: Date.now(),
    data: { url: "/", kind: data.kind || "alert" },
  });
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});
