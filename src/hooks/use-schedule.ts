import { useEffect, useState } from "react";
import { dateKey } from "@/lib/habits";
import { loadSchedule, saveSchedule, sortSchedule, type ScheduleItem } from "@/lib/schedule";

export function useSchedule() {
  const [items, setItems] = useState<ScheduleItem[] | null>(null);

  useEffect(() => {
    setItems(loadSchedule());
  }, []);

  useEffect(() => {
    if (items) saveSchedule(items);
  }, [items]);

  const upsert = (item: ScheduleItem) =>
    setItems((xs) => {
      if (!xs) return xs;
      const i = xs.findIndex((x) => x.id === item.id);
      const next = i >= 0 ? xs.map((x) => (x.id === item.id ? item : x)) : [...xs, item];
      return sortSchedule(next);
    });

  const remove = (id: string) => setItems((xs) => (xs ? xs.filter((x) => x.id !== id) : xs));

  const toggleDone = (id: string, today: Date) =>
    setItems((xs) => {
      if (!xs) return xs;
      const key = dateKey(today);
      return xs.map((x) => (x.id === id ? { ...x, done: { ...x.done, [key]: !x.done[key] } } : x));
    });

  return { items, upsert, remove, toggleDone };
}
