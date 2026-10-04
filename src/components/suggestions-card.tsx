import { useState } from "react";
import { DIFFICULTY_META, SUGGESTIONS, type Suggestion } from "@/lib/habits";

type Props = {
  existingNames: string[];
  onAdd: (s: Suggestion) => void;
};

export function SuggestionsCard({ existingNames, onAdd }: Props) {
  const [expanded, setExpanded] = useState(false);
  const taken = new Set(existingNames.map((n) => n.toLocaleLowerCase("tr-TR")));
  const available = SUGGESTIONS.filter((s) => !taken.has(s.name.toLocaleLowerCase("tr-TR")));
  if (available.length === 0) return null;
  const shown = expanded ? available : available.slice(0, 4);

  return (
    <section className="glass-soft rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          Sana öneriler
        </h2>
        {available.length > 4 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-brand"
          >
            {expanded ? "Daha az" : "Tümü"}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs font-medium text-inksoft">Tek dokunuşla listene ekle.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {shown.map((s) => (
          <button
            key={s.name}
            type="button"
            onClick={() => onAdd(s)}
            aria-label={`${s.name} ekle`}
            className="flex items-center gap-2 rounded-full bg-white/70 py-2 pl-3 pr-2.5 text-sm font-semibold text-ink ring-1 ring-black/5 transition-all hover:ring-brand/40 active:scale-95"
          >
            <span>{s.icon}</span>
            <span className="max-w-[10rem] truncate">{s.name}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-inksoft">
              {DIFFICULTY_META[s.difficulty].label}
            </span>
            <span className="grid size-5 place-items-center rounded-full bg-brand/10 text-brand">
              +
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
