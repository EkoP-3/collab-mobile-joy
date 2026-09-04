import { useCallback, useEffect, useState } from "react";
import { dateKey } from "@/lib/habits";

const MOODS_KEY = "momentum-moods-v1";

/** dateKey -> 0..4 (😞 😕 😐 🙂 😄) */
export type MoodMap = Record<string, number>;

function loadMoods(): MoodMap {
  try {
    const raw = localStorage.getItem(MOODS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MoodMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function useMoods(today: Date) {
  const [moods, setMoods] = useState<MoodMap | null>(null);

  useEffect(() => {
    setMoods(loadMoods());
  }, []);

  const setMood = useCallback(
    (mood: number) => {
      setMoods((prev) => {
        const next = { ...(prev ?? {}), [dateKey(today)]: mood };
        try {
          localStorage.setItem(MOODS_KEY, JSON.stringify(next));
        } catch {
          // storage unavailable
        }
        return next;
      });
    },
    [today],
  );

  return { moods, setMood };
}
