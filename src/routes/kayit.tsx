import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SkyBackground } from "@/components/sky-background";
import { DaySheet } from "@/components/day-sheet";
import { useHabits } from "@/hooks/use-habits";
import { useSchedule } from "@/hooks/use-schedule";
import { useMoods } from "@/hooks/use-moods";
import { useNotes } from "@/hooks/use-notes";
import { dateKey } from "@/lib/habits";

export const Route = createFileRoute("/kayit")({
  head: () => ({
    meta: [
      { title: "Kayıt Defteri — Momentum" },
      {
        name: "description",
        content:
          "Geçmiş bir aylık alışkanlıklarını, ruh halini ve günlük programını takvimde gör; geçmiş ve gelecek günlere not bırak.",
      },
      { property: "og:title", content: "Kayıt Defteri — Momentum" },
      {
        property: "og:description",
        content:
          "Takvimde geçmiş günlerini incele, istediğin güne not bırak. Veriler cihazında kalır.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KayitPage,
});

const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😄"];
const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function monthLabel(d: Date): string {
  const s = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

function KayitPage() {
  const { habits, today, toggleToday } = useHabits();
  const { items } = useSchedule();
  const { moods, setMood } = useMoods(today ?? new Date());
  const { notes, setNote } = useNotes();
  const [monthOffset, setMonthOffset] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const shell = (children: React.ReactNode) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-b from-accent-bright/50 via-ice to-mist font-sans text-ink">
      <SkyBackground />
      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
        {children}
      </main>
    </div>
  );

  if (!today) {
    return shell(
      <>
        <div className="glass h-[92px] animate-pulse rounded-3xl border border-white/60 shadow-lg shadow-brand/10" />
        <div className="glass h-[360px] animate-pulse rounded-3xl border border-white/60 shadow-md shadow-brand/10" />
      </>,
    );
  }

  const todayKey = dateKey(today);
  const list = habits ?? [];
  const planItems = items ?? [];

  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const firstWeekday = (viewMonth.getDay() + 6) % 7; // Pazartesi = 0
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells: Array<{ key: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d);
    cells.push({ key: dateKey(date), day: d });
  }

  // Son 30 günün özeti
  const last30: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30.push(dateKey(d));
  }
  const doneTotal = last30.reduce((sum, k) => sum + list.filter((h) => h.completions[k]).length, 0);
  const activeDays = last30.filter((k) => list.some((h) => h.completions[k])).length;
  const noteCount = last30.filter((k) => notes?.[k]).length;

  const ratioFor = (key: string) =>
    list.length ? list.filter((h) => h.completions[key]).length / list.length : 0;

  return shell(
    <>
      <header className="glass flex items-center justify-between rounded-3xl border border-white/60 px-5 py-4 shadow-lg shadow-brand/10">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inksoft">
            Momentum
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            Kayıt defteri
          </h1>
          <p className="mt-0.5 text-xs font-medium text-inksoft">
            Günlere dokun: neler yaptın, nasıl hissettin, not bırak
          </p>
        </div>
        <Link
          to="/"
          className="shrink-0 rounded-full bg-white/70 px-3.5 py-2 text-sm font-semibold text-brand ring-1 ring-white/80 transition-transform active:scale-95"
        >
          ← Bugün
        </Link>
      </header>

      <section className="glass-soft grid grid-cols-3 gap-2 rounded-3xl border border-white/60 p-4 text-center shadow-md shadow-brand/10">
        <div>
          <p className="font-display text-xl font-bold text-brand">{activeDays}</p>
          <p className="text-[11px] font-semibold text-inksoft">aktif gün / 30</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-brand">{doneTotal}</p>
          <p className="text-[11px] font-semibold text-inksoft">tamamlanan görev</p>
        </div>
        <div>
          <p className="font-display text-xl font-bold text-brand">{noteCount}</p>
          <p className="text-[11px] font-semibold text-inksoft">notlu gün</p>
        </div>
      </section>

      <section className="glass rounded-3xl border border-white/60 p-4 shadow-md shadow-brand/10">
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setMonthOffset((o) => o - 1)}
            aria-label="Önceki ay"
            className="grid size-9 place-items-center rounded-full bg-white/60 text-ink ring-1 ring-white/80 transition-transform active:scale-90"
          >
            ‹
          </button>
          <h2 className="font-display text-base font-semibold tracking-tight text-ink">
            {monthLabel(viewMonth)}
          </h2>
          <button
            type="button"
            onClick={() => setMonthOffset((o) => o + 1)}
            aria-label="Sonraki ay"
            className="grid size-9 place-items-center rounded-full bg-white/60 text-ink ring-1 ring-white/80 transition-transform active:scale-90"
          >
            ›
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="text-[11px] font-semibold text-inksoft/80">
              {w}
            </span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell) return <span key={`e-${i}`} />;
            const ratio = ratioFor(cell.key);
            const mood = moods?.[cell.key];
            const hasNote = Boolean(notes?.[cell.key]);
            const isToday = cell.key === todayKey;
            const isFuture = cell.key > todayKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setOpenKey(cell.key)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-xs font-semibold transition-all active:scale-90 ${
                  isToday ? "ring-2 ring-brand" : "ring-1 ring-white/70"
                } ${isFuture ? "bg-white/30 text-inksoft/60" : "bg-white/55 text-ink"}`}
                style={
                  !isFuture && ratio > 0
                    ? {
                        background: `color-mix(in srgb, var(--brand) ${Math.round(
                          12 + ratio * 45,
                        )}%, rgba(255,255,255,0.55))`,
                      }
                    : undefined
                }
              >
                <span>{cell.day}</span>
                <span className="h-3 text-[10px] leading-3">
                  {mood === undefined ? "" : MOOD_EMOJIS[mood]}
                </span>
                {hasNote && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-sun ring-1 ring-white/80" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-inksoft">
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-md bg-brand/50" /> tamamlanan alışkanlık
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-sun ring-1 ring-white/80" /> notlu gün
          </span>
        </div>
      </section>

      <p className="pb-2 text-center text-xs font-medium text-inksoft/70">
        Kayıtların ve notların yalnızca bu cihazda saklanır.
      </p>

      {openKey && (
        <DaySheet
          dayKey={openKey}
          todayKey={todayKey}
          habits={list}
          items={planItems}
          mood={moods?.[openKey]}
          note={notes?.[openKey] ?? ""}
          onMood={openKey === todayKey ? setMood : undefined}
          onToggleHabit={openKey === todayKey ? toggleToday : undefined}
          onSaveNote={(text) => setNote(openKey, text)}
          onClose={() => setOpenKey(null)}
        />
      )}
    </>,
  );
}
