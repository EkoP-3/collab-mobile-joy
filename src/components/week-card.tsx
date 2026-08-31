import { weekStats, type Habit } from "@/lib/habits";

type Props = {
  habits: Habit[];
  today: Date;
  allDone: boolean;
};

export function WeekCard({ habits, today, allDone }: Props) {
  const { done, total, pct } = weekStats(habits, today);

  return (
    <section className="glass-soft rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Bu hafta</h2>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand">{pct}%</span>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/50">
        <div
          className="h-full rounded-full bg-linear-to-r from-brand to-accent-bright transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-3 text-sm font-medium text-inksoft">
        {allDone
          ? "Bugün tüm alışkanlıklar tamamlandı ✨"
          : habits.length === 0
            ? "İlk alışkanlığını ekleyerek seriye başla."
            : `${done} / ${total} kontrol tamamlandı. Yarın da seriyi sürdür.`}
      </p>
    </section>
  );
}