export type Difficulty = "kolay" | "orta" | "zor";

export type Habit = {
  id: string;
  name: string;
  icon: string;
  time: string;
  difficulty: Difficulty;
  createdAt: string;
  completions: Record<string, boolean>;
};

export const STORAGE_KEY = "momentum-habits-v1";

export const TIME_OPTIONS = ["Sabah", "Öğle", "Akşam"] as const;

export const DIFFICULTY_OPTIONS: Difficulty[] = ["kolay", "orta", "zor"];

export const DIFFICULTY_META: Record<Difficulty, { label: string; dots: number; points: number }> = {
  kolay: { label: "Kolay", dots: 1, points: 1 },
  orta: { label: "Orta", dots: 2, points: 2 },
  zor: { label: "Zor", dots: 3, points: 3 },
};

export const ICON_OPTIONS = ["💧", "🧘", "📖", "🏃", "✍️", "💪", "🥗", "😴", "🚿", "🧹", "🎨", "📵"];

/** Uygulamanın önerdiği hazır alışkanlıklar. */
export type Suggestion = { name: string; icon: string; time: string; difficulty: Difficulty };

export const SUGGESTIONS: Suggestion[] = [
  { name: "8 bardak su iç", icon: "💧", time: "Sabah", difficulty: "kolay" },
  { name: "10 dk meditasyon", icon: "🧘", time: "Sabah", difficulty: "orta" },
  { name: "20 sayfa kitap oku", icon: "📖", time: "Akşam", difficulty: "zor" },
  { name: "30 dk yürüyüş", icon: "🏃", time: "Akşam", difficulty: "orta" },
  { name: "Şükran günlüğü yaz", icon: "✍️", time: "Akşam", difficulty: "kolay" },
  { name: "20 dk spor yap", icon: "💪", time: "Sabah", difficulty: "zor" },
  { name: "Sebze ağırlıklı bir öğün", icon: "🥗", time: "Öğle", difficulty: "orta" },
  { name: "23:00'te yat", icon: "😴", time: "Akşam", difficulty: "zor" },
  { name: "Soğuk duş al", icon: "🚿", time: "Sabah", difficulty: "zor" },
  { name: "10 dk toplan / düzenle", icon: "🧹", time: "Akşam", difficulty: "kolay" },
  { name: "15 dk yaratıcı çalışma", icon: "🎨", time: "Öğle", difficulty: "orta" },
  { name: "1 saat ekransız zaman", icon: "📵", time: "Akşam", difficulty: "zor" },
];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Local-timezone date key — never toISOString (would shift the day). */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const parts = key.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // 0 = Monday
  out.setDate(out.getDate() - day);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Consecutive completed days ending today; if today is still unchecked,
 *  the streak counts from yesterday (alive until midnight). */
export function currentStreak(habit: Habit, today: Date): number {
  let streak = 0;
  const cursor = new Date(today);
  if (!habit.completions[dateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (habit.completions[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function bestStreak(habit: Habit): number {
  const keys = Object.keys(habit.completions)
    .filter((k) => habit.completions[k])
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const d = parseKey(k);
    if (prev) {
      const diff = Math.round((d.getTime() - prev.getTime()) / 86_400_000);
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Zorluğa göre ağırlıklı günlük puan. */
export function dayScore(habits: Habit[], today: Date): { earned: number; total: number } {
  const key = dateKey(today);
  let earned = 0;
  let total = 0;
  for (const h of habits) {
    const p = DIFFICULTY_META[h.difficulty]?.points ?? 1;
    total += p;
    if (h.completions[key]) earned += p;
  }
  return { earned, total };
}

export type DayCell = {
  key: string;
  label: string;
  ratio: number;
  isToday: boolean;
};

export function weekCells(habits: Habit[], today: Date): DayCell[] {
  const mon = startOfWeek(today);
  const labels = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
  const cells: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = dateKey(d);
    const done = habits.filter((h) => h.completions[key]).length;
    cells.push({
      key,
      label: labels[i] ?? "",
      ratio: habits.length ? done / habits.length : 0,
      isToday: key === dateKey(today),
    });
  }
  return cells;
}

export function weekStats(habits: Habit[], today: Date): { done: number; total: number; pct: number } {
  const mon = startOfWeek(today);
  const todayKey = dateKey(today);
  let done = 0;
  let total = 0;
  const cursor = new Date(mon);
  while (dateKey(cursor) <= todayKey) {
    for (const h of habits) {
      total += 1;
      if (h.completions[dateKey(cursor)]) done += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

function normalize(h: Partial<Habit>): Habit {
  return {
    id: h.id ?? uid(),
    name: h.name ?? "Alışkanlık",
    icon: h.icon ?? "💧",
    time: h.time ?? "Sabah",
    difficulty: (h.difficulty as Difficulty) ?? "orta",
    createdAt: h.createdAt ?? new Date().toISOString(),
    completions: h.completions ?? {},
  };
}

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      const seeded = seedHabits();
      saveHabits(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Partial<Habit>[];
    return Array.isArray(parsed) ? parsed.map(normalize) : seedHabits();
  } catch {
    return seedHabits();
  }
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // storage unavailable — keep working in memory
  }
}

/** First-run demo data with history relative to today, so streaks look alive. */
function seedHabits(): Habit[] {
  const today = new Date();
  const ago = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return dateKey(d);
  };
  const span = (from: number, to: number) => {
    const out: Record<string, boolean> = {};
    for (let i = from; i <= to; i++) out[ago(i)] = true;
    return out;
  };
  return [
    { id: uid(), name: "8 bardak su iç", icon: "💧", time: "Sabah", difficulty: "kolay", createdAt: ago(30), completions: { ...span(6, 11), ...span(0, 4) } },
    { id: uid(), name: "10 dk meditasyon", icon: "🧘", time: "Sabah", difficulty: "orta", createdAt: ago(20), completions: { ...span(6, 15), ...span(0, 4) } },
    { id: uid(), name: "20 sayfa kitap oku", icon: "📖", time: "Akşam", difficulty: "zor", createdAt: ago(14), completions: span(1, 9) },
    { id: uid(), name: "Akşam 30 dk yürüyüş", icon: "🏃", time: "Akşam", difficulty: "orta", createdAt: ago(45), completions: span(0, 11) },
    { id: uid(), name: "Şükran günlüğü yaz", icon: "✍️", time: "Akşam", difficulty: "kolay", createdAt: ago(2), completions: span(1, 1) },
  ];
}
