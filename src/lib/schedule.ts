import { dateKey, uid } from "@/lib/habits";

export type ScheduleItem = {
  id: string;
  start: string; // "07:30"
  end?: string; // "08:00"
  title: string;
  remind: boolean;
  done: Record<string, boolean>; // dateKey -> tamamlandı
};

export const SCHEDULE_KEY = "momentum-schedule-v1";

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

export function sortSchedule(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function isValidTime(t: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
}

export function durationLabel(item: ScheduleItem): string {
  if (!item.end || !isValidTime(item.end)) return item.start;
  return `${item.start} – ${item.end}`;
}

/** Şu an aktif olan program maddesi (varsa). */
export function activeIndex(items: ScheduleItem[], now: Date): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  const sorted = sortSchedule(items);
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const start = timeToMinutes(cur.start);
    const end = cur.end && isValidTime(cur.end) ? timeToMinutes(cur.end) : timeToMinutes(sorted[i + 1]?.start ?? "23:59");
    if (mins >= start && mins < end) return i;
  }
  return -1;
}

export function scheduleStats(items: ScheduleItem[], today: Date): { done: number; total: number } {
  const key = dateKey(today);
  return { done: items.filter((i) => i.done[key]).length, total: items.length };
}

function normalize(i: Partial<ScheduleItem>): ScheduleItem {
  const item: ScheduleItem = {
    id: i.id ?? uid(),
    start: i.start && isValidTime(i.start) ? i.start : "09:00",
    title: i.title ?? "Görev",
    remind: i.remind ?? true,
    done: i.done ?? {},
  };
  if (i.end && isValidTime(i.end)) item.end = i.end;
  return item;
}

export function loadSchedule(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (raw === null) {
      const seeded = seedSchedule();
      saveSchedule(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<ScheduleItem>[];
    return Array.isArray(parsed) ? sortSchedule(parsed.map(normalize)) : seedSchedule();
  } catch {
    return seedSchedule();
  }
}

export function saveSchedule(items: ScheduleItem[]): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(items));
  } catch {
    // storage unavailable
  }
}

function seedSchedule(): ScheduleItem[] {
  return [
    { id: uid(), start: "07:00", end: "07:30", title: "Uyan ve su iç", remind: true, done: {} },
    { id: uid(), start: "07:30", end: "08:00", title: "Meditasyon + esneme", remind: true, done: {} },
    { id: uid(), start: "09:00", end: "12:30", title: "Derin çalışma bloğu", remind: true, done: {} },
    { id: uid(), start: "13:00", end: "13:45", title: "Öğle yemeği ve yürüyüş", remind: false, done: {} },
    { id: uid(), start: "21:30", end: "22:00", title: "Kitap oku", remind: true, done: {} },
  ];
}
