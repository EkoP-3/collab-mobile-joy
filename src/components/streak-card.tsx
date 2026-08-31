import { weekCells, type Habit } from "@/lib/habits";

type Props = {
  habits: Habit[];
  today: Date;
  current: number;
  best: number;
};

export function StreakCard({ habits, today, current, best }: Props) {
  const cells = weekCells(habits, today);

  return (
    <section className="glass-soft rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-inksoft">Mevcut seri</p>
          <p className="mt-1 font-display">
            <span className="text-5xl font-bold tracking-tight text-brand">{current}</span>{" "}
            <span className="text-lg font-medium text-inksoft">gün</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">Rekor</p>
          <p className="font-display text-xl font-semibold text-accent-bright">{best}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {cells.map((c) => (
          <div key={c.key} className="flex flex-col items-center gap-1.5">
            <span
              className={`text-[10px] font-medium ${c.isToday ? "font-bold text-brand" : "text-inksoft"}`}
            >
              {c.label}
            </span>
            <div className="mt-0.5 h-2 w-full rounded-full bg-white/40">
              <div
                className={`h-full rounded-full ${c.isToday ? "bg-brand" : "bg-brand/80"}`}
                style={{ width: `${Math.round(c.ratio * 100)}%` }}
              />
            </div>
            <span className={`size-1 rounded-full ${c.isToday ? "bg-brand" : "bg-transparent"}`} />
          </div>
        ))}
      </div>
    </section>
  );
}