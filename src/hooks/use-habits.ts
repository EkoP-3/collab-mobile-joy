import { useEffect, useState } from "react";
import { dateKey, loadHabits, saveHabits, type Habit } from "@/lib/habits";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setHabits(loadHabits());
    setToday(new Date());
  }, []);

  useEffect(() => {
    const refresh = () => setToday(new Date());
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    if (habits) saveHabits(habits);
  }, [habits]);

  const toggleToday = (id: string) => {
    setHabits((hs) => {
      if (!hs || !today) return hs;
      const key = dateKey(today);
      return hs.map((h) =>
        h.id === id ? { ...h, completions: { ...h.completions, [key]: !h.completions[key] } } : h,
      );
    });
  };

  const upsert = (habit: Habit) => {
    setHabits((hs) => {
      if (!hs) return hs;
      const i = hs.findIndex((h) => h.id === habit.id);
      if (i >= 0) {
        const next = [...hs];
        next[i] = habit;
        return next;
      }
      return [...hs, habit];
    });
  };

  const remove = (id: string) => setHabits((hs) => (hs ? hs.filter((h) => h.id !== id) : hs));

  return { habits, today, toggleToday, upsert, remove };
}
