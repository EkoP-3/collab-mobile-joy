import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  disablePushDevice,
  registerPushDevice,
  sendTestPush,
  syncPushSchedule,
} from "@/lib/push.functions";
import {
  getDeviceId,
  hideOngoingNotification,
  requestPushToken,
  resetOngoingNotification,
  tzOffsetMinutes,
  type PushStatus,
} from "@/lib/push";
import type { ScheduleItem } from "@/lib/schedule";

const ENABLED_KEY = "momentum-push-enabled";
const ONGOING_KEY = "momentum-push-ongoing";

function payloadItems(items: ScheduleItem[]) {
  return items.map((i) => ({
    id: i.id,
    start: i.start,
    ...(i.end ? { end: i.end } : {}),
    title: i.title,
    remind: i.remind,
  }));
}

export function usePush(items: ScheduleItem[]) {
  const register = useServerFn(registerPushDevice);
  const sync = useServerFn(syncPushSchedule);
  const disable = useServerFn(disablePushDevice);
  const test = useServerFn(sendTestPush);

  const [enabled, setEnabled] = useState(false);
  const [ongoing, setOngoing] = useState(true);
  const [status, setStatus] = useState<PushStatus>("idle");
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    setEnabled(localStorage.getItem(ENABLED_KEY) === "1");
    setOngoing(localStorage.getItem(ONGOING_KEY) !== "0");
    hydrated.current = true;
  }, []);

  // Program değiştikçe sunucudaki kopyayı güncelle.
  useEffect(() => {
    if (!hydrated.current || !enabled || items.length === 0) return;
    const t = window.setTimeout(() => {
      void sync({
        data: {
          deviceId: getDeviceId(),
          tzOffset: tzOffsetMinutes(),
          ongoing,
          items: payloadItems(items),
        },
      }).catch(() => undefined);
    }, 800);
    return () => window.clearTimeout(t);
  }, [enabled, ongoing, items, sync]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await requestPushToken();
      setStatus(result.status);
      if (result.status !== "registered") return;
      await register({
        data: {
          deviceId: getDeviceId(),
          token: result.token,
          tzOffset: tzOffsetMinutes(),
          ongoing,
          items: payloadItems(items),
        },
      });
      localStorage.setItem(ENABLED_KEY, "1");
      setEnabled(true);
      void resetOngoingNotification().catch(() => undefined);
    } catch {
      setStatus("denied");
    } finally {
      setBusy(false);
    }
  }, [items, ongoing, register]);

  const turnOff = useCallback(async () => {
    setBusy(true);
    try {
      await disable({ data: { deviceId: getDeviceId() } });
      localStorage.setItem(ENABLED_KEY, "0");
      setEnabled(false);
      setStatus("idle");
      void hideOngoingNotification().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }, [disable]);

  const toggleOngoing = useCallback(() => {
    setOngoing((v) => {
      const next = !v;
      localStorage.setItem(ONGOING_KEY, next ? "1" : "0");
      void (next ? resetOngoingNotification() : hideOngoingNotification()).catch(() => undefined);
      return next;
    });
  }, []);

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      await test({ data: { deviceId: getDeviceId() } });
    } finally {
      setBusy(false);
    }
  }, [test]);

  return { enabled, ongoing, status, busy, enable, turnOff, toggleOngoing, sendTest };
}
