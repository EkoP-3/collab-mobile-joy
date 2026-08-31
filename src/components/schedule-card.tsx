import { dateKey } from "@/lib/habits";
import { activeIndex, durationLabel, sortSchedule, type ScheduleItem } from "@/lib/schedule";

type Props = {
  items: ScheduleItem[];
  today: Date;
  onToggle: (id: string) => void;
  onEdit: (item: ScheduleItem) => void;
  onAdd: () => void;
};

export function ScheduleCard({ items, today, onToggle, onEdit, onAdd }: Props) {
  const sorted = sortSchedule(items);
  const active = activeIndex(sorted, today);
  const key = dateKey(today);
  const done = sorted.filter((i) => i.done[key]).length;

  return (
    <section className="glass rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Günlük program</h2>
        <div className="flex items-center gap-2.5">
          {sorted.length > 0 && (
            <span className="text-sm font-semibold text-inksoft">
              {done} / {sorted.length}
            </span>
          )}
          <button
            type="button"
            onClick={onAdd}
            className="rounded-full bg-brand/10 px-3.5 py-1.5 text-sm font-semibold text-brand ring-1 ring-brand/30 transition-all hover:bg-brand/15 active:scale-95"
          >
            + Saat ekle
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-inksoft">
          Gününü saat saat planla: kalkış, çalışma blokları, spor, okuma…
        </p>
      ) : (
        <ol className="mt-4 flex flex-col">
          {sorted.map((item, i) => {
            const isDone = Boolean(item.done[key]);
            const isActive = i === active;
            return (
              <li key={item.id} className="flex gap-3">
                <div className="flex w-[68px] shrink-0 flex-col items-end pt-1">
                  <span
                    className={`font-display text-sm font-bold tabular-nums ${
                      isActive ? "text-brand" : "text-inksoft"
                    }`}
                  >
                    {item.start}
                  </span>
                  {item.end && <span className="text-[10px] font-medium text-inksoft/70">{item.end}</span>}
                </div>

                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    aria-label={isDone ? `${item.title} — geri al` : `${item.title} — tamamla`}
                    aria-pressed={isDone}
                    onClick={() => onToggle(item.id)}
                    className={`mt-1.5 grid size-5 shrink-0 place-items-center rounded-full transition-all ${
                      isDone
                        ? "bg-brand text-white"
                        : isActive
                          ? "bg-white ring-2 ring-brand"
                          : "bg-white/70 ring-2 ring-brand/30"
                    }`}
                  >
                    {isDone && (
                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  {i < sorted.length - 1 && <span className="my-1 w-px flex-1 bg-brand/20" />}
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className={`mb-2 min-w-0 flex-1 rounded-xl px-3 py-2 text-left transition-colors ${
                    isActive ? "bg-brand/10 ring-1 ring-brand/25" : "hover:bg-white/50"
                  }`}
                >
                  <p
                    className={`truncate text-[15px] font-semibold ${
                      isDone ? "text-inksoft line-through" : "text-ink"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-inksoft">
                    {durationLabel(item)}
                    {item.remind ? " · 🔔 hatırlat" : ""}
                    {isActive ? " · şimdi" : ""}
                  </p>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
