import { useCallback, useEffect, useRef, useState } from "react";
import { dateKey } from "@/lib/habits";
import { timeToMinutes, type ScheduleItem } from "@/lib/schedule";

export type PermissionState = "unsupported" | "iframe" | "default" | "granted" | "denied";

/**
 * Cihaz içi (yerel) hatırlatıcılar: uygulama açıkken program saatleri geldiğinde
 * tarayıcı bildirimi gönderir. Sunucu/hesap gerektirmez.
 */
export function useReminders(items: ScheduleItem[]) {
  const [permission, setPermission] = useState<PermissionState>("default");
  const fired = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    if (window.top !== window.self) {
      setPermission("iframe");
      return;
    }
    setPermission(Notification.permission as PermissionState);
  }, []);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (window.top !== window.self) {
      setPermission("iframe");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  }, []);

  useEffect(() => {
    if (permission !== "granted" || items.length === 0) return;
    const tick = () => {
      const now = new Date();
      const key = dateKey(now);
      const mins = now.getHours() * 60 + now.getMinutes();
      for (const item of items) {
        if (!item.remind || item.done[key]) continue;
        const start = timeToMinutes(item.start);
        if (mins < start || mins > start + 2) continue;
        const id = `${key}-${item.id}`;
        if (fired.current.has(id)) continue;
        fired.current.add(id);
        try {
          new Notification("Momentum — sıradaki görev", {
            body: `${item.start} · ${item.title}`,
            tag: id,
          });
        } catch {
          // bildirim gönderilemedi
        }
      }
    };
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => window.clearInterval(t);
  }, [permission, items]);

  return { permission, request };
}
