import { currentStreak, DIFFICULTY_META, type Habit } from "@/lib/habits";

type Props = {
  habit: Habit;
  today: Date;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export function HabitCard({ habit, today, done, onToggle, onEdit }: Props) {
  const streak = currentStreak(habit, today);
  const isNew = streak <= 1;
  const sub = done
    ? `Bugün tamamlandı · ${streak} günlük seri`
    : isNew
      ? `Yeni alışkanlık · ${habit.time}`
      : `${habit.time} · ${streak} günlük seri`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${habit.name} — düzenle`}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className="glass flex cursor-pointer items-center gap-4 rounded-2xl border border-white/60 p-4 shadow-md shadow-brand/10 transition-transform active:scale-[0.99]"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/70 text-xl ring-1 ring-black/5">
        {habit.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate font-display text-[15px] font-semibold tracking-tight ${
            done ? "text-inksoft" : "text-ink"
          }`}
        >
          {habit.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-xs font-medium text-inksoft">{sub}</span>
          <span
            className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand ring-1 ring-brand/20"
            title={`Zorluk: ${DIFFICULTY_META[habit.difficulty].label}`}
          >
            {DIFFICULTY_META[habit.difficulty].label}
          </span>
        </div>
      </div>
      <button
        type="button"
        aria-label={done ? `${habit.name} — tamamlanmadı olarak işaretle` : `${habit.name} — tamamla`}
        aria-pressed={done}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-200 ${
          done
            ? "bg-brand text-white shadow-md shadow-brand/30"
            : "bg-white/60 ring-2 ring-brand/40 hover:ring-brand/70"
        }`}
      >
        {done && (
          <svg
            key={habit.id}
            className="size-4 animate-pop"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );
}