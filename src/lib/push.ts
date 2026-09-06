/**
 * Tarayıcı tarafı push kaydı (Firebase Cloud Messaging).
 * Sadece anonim bir cihaz kimliği + bildirim jetonu saklanır; hesap yoktur.
 */

export type PushStatus =
  | "idle"
  | "not-configured"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "registered";

const DEVICE_KEY = "momentum-device-id";

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

const appId = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID"] as
  | string
  | undefined;
const vapidKey = import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY"] as
  | string
  | undefined;

const firebaseConfig = {
  apiKey: import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY"] as
    | string
    | undefined,
  projectId: import.meta.env["VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID"] as
    | string
    | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

export function tzOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

export async function requestPushToken(): Promise<
  { status: "registered"; token: string } | { status: Exclude<PushStatus, "registered" | "idle"> }
> {
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !appId ||
    !vapidKey ||
    !firebaseConfig.messagingSenderId
  ) {
    return { status: "not-configured" };
  }

  const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) {
    return { status: "unsupported" };
  }
  if (window.top !== window.self) {
    return { status: "open-in-new-tab" };
  }

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const query = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    appId,
    messagingSenderId: firebaseConfig.messagingSenderId,
  }).toString();

  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${query}`,
  );
  // Yeni sürüm varsa hemen yüklensin; eski bildirim davranışı takılı kalmasın.
  await registration.update().catch(() => undefined);
  await navigator.serviceWorker.ready;
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: firebaseConfig.apiKey,
        projectId: firebaseConfig.projectId,
        appId,
        messagingSenderId: firebaseConfig.messagingSenderId,
      });
  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  return token ? { status: "registered", token } : { status: "denied" };
}
