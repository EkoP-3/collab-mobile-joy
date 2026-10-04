import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import {
  getOngoingStatus,
  isNativeApp,
  openExactAlarmSettings,
  openNotificationSettings,
  requestNotificationPermission,
  syncOngoing,
  type OngoingStatus,
} from "@/lib/ongoing";
import type { ScheduleItem } from "@/lib/schedule";

const ENABLED_KEY = "momentum-notify-enabled";
const ONGOING_KEY = "momentum-notify-ongoing";
const REMINDERS_KEY = "momentum-notify-reminders";

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // depolama kapalı
  }
}

/**
 * Android uygulamasında: sabit "şu an / sıradaki" bildirimi + görev hatırlatıcıları.
 * Her şey cihazda hesaplanır; sunucu ya da hesap yoktur. Tarayıcıda `native` false'tur.
 */
export function useNotifications(items: ScheduleItem[]) {
  const [native, setNative] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [ongoing, setOngoing] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [status, setStatus] = useState<OngoingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    setNative(isNativeApp());
    setEnabled(readFlag(ENABLED_KEY, false));
    setOngoing(readFlag(ONGOING_KEY, true));
    setReminders(readFlag(REMINDERS_KEY, true));
    hydrated.current = true;
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await getOngoingStatus());
    } catch {
      // eklenti yok / hata: durum bilinmiyor
    }
  }, []);

  // Uygulama öne geldiğinde izinler ayarlardan değişmiş olabilir.
  useEffect(() => {
    if (!native) return;
    void refreshStatus();
    const sub = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void refreshStatus();
    });
    return () => {
      void sub.then((h) => h.remove());
    };
  }, [native, refreshStatus]);

  // Program ya da ayarlar değiştikçe native tarafı güncelle.
  useEffect(() => {
    if (!native || !hydrated.current) return;
    const t = window.setTimeout(() => {
      void syncOngoing({
        items,
        ongoing: enabled && ongoing,
        reminders: enabled && reminders,
      })
        .then(setStatus)
        .catch(() => undefined);
    }, 400);
    return () => window.clearTimeout(t);
  }, [native, enabled, ongoing, reminders, items]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const next = await requestNotificationPermission();
      setStatus(next);
      if (next.notifications) {
        writeFlag(ENABLED_KEY, true);
        setEnabled(true);
      }
    } catch {
      // izin akışı başarısız
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(() => {
    writeFlag(ENABLED_KEY, false);
    setEnabled(false);
  }, []);

  const toggleOngoing = useCallback(() => {
    setOngoing((v) => {
      writeFlag(ONGOING_KEY, !v);
      return !v;
    });
  }, []);

  const toggleReminders = useCallback(() => {
    setReminders((v) => {
      writeFlag(REMINDERS_KEY, !v);
      return !v;
    });
  }, []);

  return {
    native,
    enabled,
    ongoing,
    reminders,
    status,
    busy,
    enable,
    disable,
    toggleOngoing,
    toggleReminders,
    openNotificationSettings: () => void openNotificationSettings().catch(() => undefined),
    openExactAlarmSettings: () => void openExactAlarmSettings().catch(() => undefined),
  };
}
