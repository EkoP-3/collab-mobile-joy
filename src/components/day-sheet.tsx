import { useState } from "react";
import type { Habit } from "@/lib/habits";
import { parseKey } from "@/lib/habits";
import { durationLabel, sortSchedule, type ScheduleItem } from "@/lib/schedule";

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const MOOD_LABELS = ["Zor", "Durgun", "İdare eder", "İyi", "Harika"];

type Props = {
  dayKey: string;
  todayKey: string;
  habits: Habit[];
  items: ScheduleItem[];
  mood: number | undefined;
  note: string;
  onMood?: (mood: number) => void;
  onToggleHabit?: (id: string) => void;
  onSaveNote: (text: string) => void;
  onClose: () => void;
};

export function DaySheet({
  dayKey,
  todayKey,
  habits,
  items,
  mood,
  note,
  onMood,
  onToggleHabit,
  onSaveNote,
  onClose,
}: Props) {
  const [text, setText] = useState(note);
  const date = parseKey(dayKey);
  const label = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  const title = label.charAt(0).toLocaleUpperCase("tr-TR") + label.slice(1);
  const isFuture = dayKey > todayKey;
  const doneHabits = habits.filter((h) => h.completions[dayKey]);
  const donePlan = sortSchedule(items).filter((i) => i.done[dayKey]);

  const save = () => {
    onSaveNote(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-ink/30 backdrop-blur-sm"
      />
      <div className="animate-sheet-up relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/60 bg-white/85 p-5 pb-8 shadow-2xl shadow-brand/20 backdrop-blur-xl">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
          {dayKey === todayKey && (
            <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
              Bugün
            </span>
          )}
        </div>

        {!isFuture && (
          <>
            <h3 className="mt-5 text-sm font-semibold text-inksoft">Alışkanlıklar</h3>
            {habits.length === 0 ? (
              <p className="mt-1 text-sm text-inksoft">Kayıtlı alışkanlık yok.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {habits.map((h) => {
                  const done = Boolean(h.completions[dayKey]);
                  return (
                    <li key={h.id}>
                      <button
                        type="button"
                        disabled={!onToggleHabit}
                        onClick={() => onToggleHabit?.(h.id)}
                        className={`flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium ring-1 transition-all ${
                          done
                            ? "bg-brand/12 text-ink ring-brand/30"
                            : "bg-white/60 text-inksoft ring-white/80"
                        } ${onToggleHabit ? "active:scale-[0.98]" : ""}`}
                      >
                        <span className="text-base">{h.icon}</span>
                        <span className="flex-1 truncate">{h.name}</span>
                        <span className={done ? "text-brand" : "text-inksoft/50"}>
                          {done ? "✓" : "—"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-2 text-xs font-medium text-inksoft">
              {doneHabits.length} / {habits.length} tamamlandı
            </p>

            <h3 className="mt-5 text-sm font-semibold text-inksoft">Program</h3>
            {donePlan.length === 0 ? (
              <p className="mt-1 text-sm text-inksoft">Bu gün işaretlenmiş program adımı yok.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {donePlan.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center gap-2.5 rounded-2xl bg-white/60 px-3 py-2 text-sm ring-1 ring-white/80"
                  >
                    <span className="font-display text-xs font-bold text-brand">
                      {durationLabel(i)}
                    </span>
                    <span className="flex-1 truncate font-medium text-ink">{i.title}</span>
                    <span className="text-brand">✓</span>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="mt-5 text-sm font-semibold text-inksoft">Ruh hali</h3>
            <div className="mt-2 flex justify-between gap-1">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={!onMood}
                  onClick={() => onMood?.(i)}
                  title={MOOD_LABELS[i]}
                  className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xl transition-all ${
                    mood === i
                      ? "bg-brand/15 ring-2 ring-brand/50"
                      : "bg-white/50 opacity-60 ring-1 ring-white/70"
                  } ${onMood ? "active:scale-90" : ""}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-semibold text-inksoft/80">{MOOD_LABELS[i]}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <h3 className="mt-5 text-sm font-semibold text-inksoft">Not</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={
            isFuture ? "Bu gün için planın veya hatırlatman…" : "O gün aklında kalanlar…"
          }
          className="mt-2 w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink ring-1 ring-white/80 outline-none placeholder:text-inksoft/60 focus:ring-2 focus:ring-brand/40"
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full bg-white/70 py-3 text-sm font-semibold text-inksoft ring-1 ring-white/80 transition-transform active:scale-95"
          >
            Kapat
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
          >
            Notu kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
