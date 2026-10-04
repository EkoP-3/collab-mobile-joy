import { useEffect, useState } from "react";
import {
  DIFFICULTY_META,
  DIFFICULTY_OPTIONS,
  ICON_OPTIONS,
  TIME_OPTIONS,
  type Difficulty,
  type Habit,
} from "@/lib/habits";

export type HabitDraft = {
  id?: string;
  name: string;
  icon: string;
  time: string;
  difficulty: Difficulty;
};

type Props = {
  habit?: Habit | undefined;
  onClose: () => void;
  onSave: (draft: HabitDraft) => void;
  onDelete: (id: string) => void;
};

export function HabitSheet({ habit, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(ICON_OPTIONS[0] ?? "💧");
  const [time, setTime] = useState<string>(TIME_OPTIONS[0] ?? "Sabah");
  const [difficulty, setDifficulty] = useState<Difficulty>("orta");
  const [error, setError] = useState(false);

  useEffect(() => {
    setName(habit?.name ?? "");
    setIcon(habit?.icon ?? ICON_OPTIONS[0] ?? "💧");
    setTime(habit?.time ?? TIME_OPTIONS[0] ?? "Sabah");
    setDifficulty(habit?.difficulty ?? "orta");
    setError(false);
  }, [habit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    onSave(
      habit
        ? { id: habit.id, name: trimmed, icon, time, difficulty }
        : { name: trimmed, icon, time, difficulty },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-ink/25 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={habit ? "Alışkanlığı düzenle" : "Yeni alışkanlık"}
        className="relative z-10 max-h-[88vh] animate-sheet-up overflow-y-auto rounded-t-[28px] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-brand/10 backdrop-blur-2xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          {habit ? "Alışkanlığı düzenle" : "Yeni alışkanlık"}
        </h2>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
          İkon
        </p>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {ICON_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setIcon(e)}
              aria-label={`İkon ${e}`}
              className={`grid h-11 place-items-center rounded-xl text-xl transition-all ${
                icon === e
                  ? "bg-brand/15 ring-2 ring-brand"
                  : "bg-white/60 ring-1 ring-black/5 hover:ring-black/10"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
          Ad
        </p>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(false);
          }}
          placeholder="Örn. 8 bardak su iç"
          maxLength={60}
          autoFocus
          className={`mt-2 w-full rounded-2xl border bg-white/70 px-4 py-3 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-inksoft/60 focus:ring-2 ${
            error
              ? "border-destructive ring-2 ring-destructive/40"
              : "border-white/60 focus:border-brand/50 focus:ring-brand/40"
          }`}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-destructive">Bir isim yazmalısın.</p>
        )}

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
          Zaman
        </p>
        <div className="mt-2 flex gap-2">
          {TIME_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={`flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition-all ${
                time === t
                  ? "bg-brand text-white shadow-md shadow-brand/30"
                  : "bg-white/60 text-ink ring-1 ring-black/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
          Senin için zorluğu
        </p>
        <div className="mt-2 flex gap-2">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              aria-pressed={difficulty === d}
              className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                difficulty === d
                  ? "bg-brand text-white shadow-md shadow-brand/30"
                  : "bg-white/60 text-ink ring-1 ring-black/5"
              }`}
            >
              <span className="block">{DIFFICULTY_META[d].label}</span>
              <span className="mt-0.5 block text-[10px] font-medium opacity-80">
                {"●".repeat(DIFFICULTY_META[d].dots)}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-inksoft">
          Zor işaretlediğin alışkanlıklar günlük puanında daha fazla değer taşır.
        </p>

        <div className="mt-6 flex items-center gap-3">
          {habit && (
            <button
              type="button"
              onClick={() => onDelete(habit.id)}
              className="rounded-full px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              Sil
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            className="flex-1 rounded-full bg-brand py-3 text-[15px] font-semibold text-white shadow-lg shadow-brand/30 transition-transform active:scale-[0.98]"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
