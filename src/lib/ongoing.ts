/**
 * Android'deki kalıcı "şu an / sıradaki" bildirimi ve görev hatırlatıcıları için köprü.
 * Native tarafı: android/app/src/main/java/io/github/ekop3/momentum/OngoingPlugin.java
 * Tarayıcıda (web/PWA) bu eklenti yoktur; `isNativeApp()` ile korunmalıdır.
 */
import { Capacitor, registerPlugin } from "@capacitor/core";
import type { ScheduleItem } from "@/lib/schedule";

export type OngoingStatus = {
  /** Bildirimler sistem ayarlarında / izinle açık mı? */
  notifications: boolean;
  /** Tam zamanlı alarm kurulabiliyor mu? (kapalıysa bildirimler birkaç dakika gecikebilir) */
  exactAlarms: boolean;
};

export type SyncPayloadItem = {
  id: string;
  start: string;
  end?: string;
  title: string;
  remind: boolean;
  /** Tamamlandı işaretli günler (yyyy-MM-dd); yalnızca son birkaç gün gönderilir. */
  done: string[];
};

type OngoingPlugin = {
  sync(options: {
    items: SyncPayloadItem[];
    ongoing: boolean;
    reminders: boolean;
  }): Promise<OngoingStatus>;
  getStatus(): Promise<OngoingStatus>;
  requestNotificationPermission(): Promise<OngoingStatus>;
  openNotificationSettings(): Promise<void>;
  openExactAlarmSettings(): Promise<void>;
};

const Ongoing = registerPlugin<OngoingPlugin>("Ongoing");

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

const MAX_DONE_DAYS = 3;

export function toPayload(items: ScheduleItem[]): SyncPayloadItem[] {
  return items.map((i) => {
    const done = Object.keys(i.done)
      .filter((k) => i.done[k])
      .sort()
      .slice(-MAX_DONE_DAYS);
    return {
      id: i.id,
      start: i.start,
      ...(i.end ? { end: i.end } : {}),
      title: i.title,
      remind: i.remind,
      done,
    };
  });
}

export const syncOngoing = (opts: {
  items: ScheduleItem[];
  ongoing: boolean;
  reminders: boolean;
}): Promise<OngoingStatus> =>
  Ongoing.sync({ items: toPayload(opts.items), ongoing: opts.ongoing, reminders: opts.reminders });

export const getOngoingStatus = (): Promise<OngoingStatus> => Ongoing.getStatus();
export const requestNotificationPermission = (): Promise<OngoingStatus> =>
  Ongoing.requestNotificationPermission();
export const openNotificationSettings = (): Promise<void> => Ongoing.openNotificationSettings();
export const openExactAlarmSettings = (): Promise<void> => Ongoing.openExactAlarmSettings();
