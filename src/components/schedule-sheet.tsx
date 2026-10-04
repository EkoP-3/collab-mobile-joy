import { useEffect, useState } from "react";
import { isValidTime, type ScheduleItem } from "@/lib/schedule";

export type ScheduleDraft = {
  id?: string;
  start: string;
  end?: string;
  title: string;
  remind: boolean;
};

type Props = {
  item?: ScheduleItem | undefined;
  onClose: () => void;
  onSave: (draft: ScheduleDraft) => void;
  onDelete: (id: string) => void;
};

export function ScheduleSheet({ item, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("");
  const [remind, setRemind] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(item?.title ?? "");
    setStart(item?.start ?? "09:00");
    setEnd(item?.end ?? "");
    setRemind(item?.remind ?? true);
    setError(null);
  }, [item]);

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
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Bir görev adı yazmalısın.");
      return;
    }
    if (!isValidTime(start)) {
      setError("Geçerli bir başlangıç saati seç.");
      return;
    }
    const draft: ScheduleDraft = { start, title: trimmed, remind };
    if (item) draft.id = item.id;
    if (end && isValidTime(end)) draft.end = end;
    onSave(draft);
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
        aria-label={item ? "Programı düzenle" : "Programa ekle"}
        className="relative z-10 animate-sheet-up rounded-t-[28px] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-brand/10 backdrop-blur-2xl"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ink/15" />
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          {item ? "Programı düzenle" : "Programa ekle"}
        </h2>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
          Görev
        </p>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="Örn. Derin çalışma bloğu"
          maxLength={80}
          autoFocus
          className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-inksoft/60 focus:border-brand/50 focus:ring-2 focus:ring-brand/40"
        />

        <div className="mt-5 flex gap-3">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
              Başlangıç
            </p>
            <input
              type="time"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setError(null);
              }}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[15px] font-semibold text-ink outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/40"
            />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-inksoft">
              Bitiş (ops.)
            </p>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-[15px] font-semibold text-ink outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/40"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRemind((v) => !v)}
          aria-pressed={remind}
          className="mt-5 flex w-full items-center justify-between rounded-2xl bg-white/60 px-4 py-3 ring-1 ring-black/5"
        >
          <span className="text-sm font-semibold text-ink">🔔 Bu saatte hatırlat</span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${remind ? "bg-brand" : "bg-ink/20"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                remind ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          {item && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
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
