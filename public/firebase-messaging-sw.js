/* Momentum — push service worker (yalnızca bildirim gösterimi için).
 * Firebase SDK kullanılmaz: FCM'den gelen web push paketi doğrudan okunur, böylece
 * uygulama açıkken de kapalıyken de bildirim aynı şekilde gösterilir.
 */

const ONGOING_TAG = "momentum-ongoing";
const STATE_CACHE = "momentum-push-state";
const HIDDEN_URL = "/__momentum/ongoing-hidden";
const ICON = "/icons/icon-192.png";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Kullanıcı "Gizle" dediyse hangi bildirim imzasının gizlendiğini sakla. */
async function getHidden() {
  try {
    const cache = await caches.open(STATE_CACHE);
    const res = await cache.match(HIDDEN_URL);
    return res ? await res.text() : "";
  } catch {
    return "";
  }
}

async function setHidden(signature) {
  try {
    const cache = await caches.open(STATE_CACHE);
    if (signature) await cache.put(HIDDEN_URL, new Response(signature));
    else await cache.delete(HIDDEN_URL);
  } catch {
    /* yoksay */
  }
}

function parsePayload(event) {
  if (!event.data) return {};
  try {
    const raw = event.data.json();
    // FCM veri mesajı: { data: {...}, from, priority, fcmMessageId }
    if (raw && typeof raw === "object" && raw.data && typeof raw.data === "object") return raw.data;
    return raw || {};
  } catch {
    return { title: "Momentum", body: event.data.text() };
  }
}

function showOngoing(data) {
  const title = data.title || "Momentum";
  const body = data.body || "";
  return self.registration.showNotification(title, {
    body,
    icon: ICON,
    badge: ICON,
    tag: ONGOING_TAG,
    renotify: false,
    silent: true,
    requireInteraction: true,
    timestamp: Date.now(),
    actions: [
      { action: "open", title: "Aç" },
      { action: "hide", title: "Gizle" },
    ],
    data: { url: "/", kind: "ongoing", signature: `${title}|${body}`, title, body },
  });
}

function showAlert(data) {
  return self.registration.showNotification(data.title || "Momentum", {
    body: data.body || "",
    icon: ICON,
    badge: ICON,
    tag: data.tag || "momentum",
    renotify: true,
    vibrate: [80, 40, 80],
    timestamp: Date.now(),
    data: { url: "/", kind: "alert" },
  });
}

self.addEventListener("push", (event) => {
  const data = parsePayload(event);
  const isOngoing = data.kind === "ongoing";

  event.waitUntil(
    (async () => {
      if (!isOngoing) return showAlert(data);

      const signature = `${data.title || "Momentum"}|${data.body || ""}`;
      const hidden = await getHidden();
      // Yeni içerik geldiyse gizleme kalkar; aynı içerik gizlenmişse tekrar gösterme.
      if (hidden && hidden === signature) return;
      if (hidden) await setHidden("");
      return showOngoing(data);
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const n = event.notification;
  const isOngoing = n.data && n.data.kind === "ongoing";

  if (event.action === "hide" && isOngoing) {
    event.waitUntil(setHidden(n.data.signature || "").then(() => n.close()));
    return;
  }

  // "Aç" veya bildirimin kendisine dokunma: uygulamayı öne getir.
  // Kalıcı bildirim dokununca kapanmasın; kapanırsa aşağıdaki close olayı yeniden gösterir.
  if (!isOngoing) n.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow("/");
    }),
  );
});

/* Shazam tarzı: kullanıcı kalıcı bildirimi kaydırıp silerse (Gizle demediyse) geri getir. */
self.addEventListener("notificationclose", (event) => {
  const n = event.notification;
  if (!n.data || n.data.kind !== "ongoing") return;
  event.waitUntil(
    (async () => {
      const hidden = await getHidden();
      if (hidden && hidden === n.data.signature) return;
      await showOngoing({ title: n.data.title, body: n.data.body });
    })(),
  );
});

/* Uygulama "kalıcı bildirimi kapat" dediğinde: gizle ve temizle. */
self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== "hide-ongoing") return;
  event.waitUntil(
    (async () => {
      const list = await self.registration.getNotifications({ tag: ONGOING_TAG });
      const sig = list[0] && list[0].data ? list[0].data.signature || "" : "";
      await setHidden(sig || "*");
      for (const n of list) n.close();
    })(),
  );
});
