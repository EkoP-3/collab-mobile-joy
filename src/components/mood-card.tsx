import { dateKey, startOfWeek } from "@/lib/habits";
import type { MoodMap } from "@/hooks/use-moods";

const EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const LABELS = ["Zor", "Durgun", "İdare eder", "İyi", "Harika"];

type Props = {
  moods: MoodMap | null;
  today: Date;
  onPick: (mood: number) => void;
};

export function MoodCard({ moods, today, onPick }: Props) {
  const todayKey = dateKey(today);
  const selected = moods?.[todayKey];

  // Bu haftanın günleri (Pt..Pz)
  const mon = startOfWeek(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = dateKey(d);
    return { key, mood: moods?.[key], future: key > todayKey, isToday: key === todayKey };
  });

  return (
    <section className="glass rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
        Bugün nasıl hissediyorsun?
      </h2>
      <div className="mt-3 flex justify-between gap-1">
        {EMOJIS.map((emoji, i) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(i)}
            title={LABELS[i]}
            aria-pressed={selected === i}
            className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 text-2xl transition-all active:scale-90 ${
              selected === i
                ? "animate-pop bg-brand/15 ring-2 ring-brand/50"
                : "bg-white/40 ring-1 ring-white/70 hover:bg-white/60"
            }`}
          >
            <span>{emoji}</span>
            <span
              className={`text-[10px] font-semibold ${
                selected === i ? "text-brand" : "text-inksoft/80"
              }`}
            >
              {LABELS[i]}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex justify-between px-1">
        {week.map((d) => (
          <span
            key={d.key}
            className={`grid size-7 place-items-center rounded-full text-sm ${
              d.isToday ? "ring-2 ring-brand/50" : ""
            } ${d.mood === undefined ? "text-inksoft/30" : ""}`}
          >
            {d.mood === undefined ? (d.future ? "·" : "○") : EMOJIS[d.mood]}
          </span>
        ))}
      </div>
    </section>
  );
}
