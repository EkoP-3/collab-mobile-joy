import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { StreakCard } from "@/components/streak-card";
import { HabitCard } from "@/components/habit-card";
import { WeekCard } from "@/components/week-card";
import { HabitSheet, type HabitDraft } from "@/components/habit-sheet";
import { SuggestionsCard } from "@/components/suggestions-card";
import { ScheduleCard } from "@/components/schedule-card";
import { ScheduleSheet, type ScheduleDraft } from "@/components/schedule-sheet";
import { ReminderBanner } from "@/components/reminder-banner";
import { PushCard } from "@/components/push-card";
import { useHabits } from "@/hooks/use-habits";
import { useSchedule } from "@/hooks/use-schedule";
import { useReminders } from "@/hooks/use-reminders";
import { usePush } from "@/hooks/use-push";
import {
  bestStreak,
  currentStreak,
  dateKey,
  dayScore,
  uid,
  type Habit,
  type Suggestion,
} from "@/lib/habits";
import type { ScheduleItem } from "@/lib/schedule";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Momentum — Alışkanlık ve Günlük Program Takibi" },
      {
        name: "description",
        content:
          "Alışkanlık önerileri, kendi görevlerin, zorluk seviyeleri ve saat saat günlük program. Tüm veriler cihazında kalır, hesap gerekmez.",
      },
      { property: "og:title", content: "Momentum — Alışkanlık ve Günlük Program Takibi" },
      {
        property: "og:description",
        content:
          "Alışkanlık önerileri, kendi görevlerin, zorluk seviyeleri ve saat saat günlük program. Tüm veriler cihazında kalır.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { habits, today, toggleToday, upsert, remove } = useHabits();
  const { items, upsert: upsertItem, remove: removeItem, toggleDone } = useSchedule();
  const scheduleItems = items ?? [];
  const { permission, request } = useReminders(scheduleItems);
  const push = usePush(scheduleItems);
  const [sheet, setSheet] = useState<{ open: boolean; habit?: Habit }>({ open: false });
  const [planSheet, setPlanSheet] = useState<{ open: boolean; item?: ScheduleItem }>({ open: false });

  // `today` is set client-side only (local date), so the first render shows a skeleton.
  if (!today) {
    return (
      <div className="relative min-h-screen w-full bg-linear-to-br from-ice via-mist to-brand/30">
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
          <div className="glass h-[92px] animate-pulse rounded-3xl border border-white/60 shadow-lg shadow-brand/10" />
          <div className="glass-soft h-[168px] animate-pulse rounded-3xl border border-white/60 shadow-md shadow-brand/10" />
          <div className="glass h-[220px] animate-pulse rounded-3xl border border-white/60 shadow-md shadow-brand/10" />
          <div className="glass-soft h-[130px] animate-pulse rounded-3xl border border-white/60 shadow-md shadow-brand/10" />
        </main>
      </div>
    );
  }

  const todayKey = dateKey(today);
  const list = habits ?? [];
  const doneCount = list.filter((h) => h.completions[todayKey]).length;
  const current = list.length ? Math.max(...list.map((h) => currentStreak(h, today))) : 0;
  const best = list.length ? Math.max(...list.map((h) => bestStreak(h))) : 0;
  const allDone = list.length > 0 && doneCount === list.length;
  const score = dayScore(list, today);

  const handleSave = (draft: HabitDraft) => {
    if (draft.id) {
      const existing = list.find((h) => h.id === draft.id);
      if (existing) {
        upsert({
          ...existing,
          name: draft.name,
          icon: draft.icon,
          time: draft.time,
          difficulty: draft.difficulty,
        });
      }
    } else {
      upsert({
        id: uid(),
        name: draft.name,
        icon: draft.icon,
        time: draft.time,
        difficulty: draft.difficulty,
        createdAt: today.toISOString(),
        completions: {},
      });
    }
    setSheet({ open: false });
  };

  const handleDelete = (id: string) => {
    remove(id);
    setSheet({ open: false });
  };

  const addSuggestion = (s: Suggestion) => {
    upsert({
      id: uid(),
      name: s.name,
      icon: s.icon,
      time: s.time,
      difficulty: s.difficulty,
      createdAt: today.toISOString(),
      completions: {},
    });
  };

  const handlePlanSave = (draft: ScheduleDraft) => {
    const existing = draft.id ? scheduleItems.find((x) => x.id === draft.id) : undefined;
    const next: ScheduleItem = {
      id: draft.id ?? uid(),
      start: draft.start,
      title: draft.title,
      remind: draft.remind,
      done: existing?.done ?? {},
    };
    if (draft.end) next.end = draft.end;
    upsertItem(next);
    setPlanSheet({ open: false });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-br from-ice via-mist to-brand/30 font-sans text-ink">
      <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-accent-bright/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 size-96 rounded-full bg-white/50 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 py-8">
        <AppHeader today={today} bestCurrentStreak={current} />
        <StreakCard habits={list} today={today} current={current} best={best} />

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
              Bugünün alışkanlıkları
            </h2>
            <div className="flex items-center gap-2.5">
              {list.length > 0 && (
                <span className="text-sm font-semibold text-inksoft">
                  {doneCount} / {list.length}
                </span>
              )}
              <button
                type="button"
                onClick={() => setSheet({ open: true })}
                className="rounded-full bg-brand/10 px-3.5 py-1.5 text-sm font-semibold text-brand ring-1 ring-brand/30 transition-all hover:bg-brand/15 active:scale-95"
              >
                + Yeni
              </button>
            </div>
          </div>

          {habits === null ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="glass h-[76px] animate-pulse rounded-2xl border border-white/60 p-4 shadow-md shadow-brand/10"
                />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="glass rounded-2xl border border-white/60 p-6 text-center shadow-md shadow-brand/10">
              <p className="text-3xl">🌱</p>
              <p className="mt-2 font-display text-base font-semibold text-ink">Henüz alışkanlık yok</p>
              <p className="mt-1 text-sm font-medium text-inksoft">
                İlk alışkanlığını ekleyerek seriye başla.
              </p>
              <button
                type="button"
                onClick={() => setSheet({ open: true })}
                className="mt-4 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-transform active:scale-95"
              >
                İlk alışkanlığını ekle
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {list.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    today={today}
                    done={Boolean(h.completions[todayKey])}
                    onToggle={() => toggleToday(h.id)}
                    onEdit={() => setSheet({ open: true, habit: h })}
                  />
                ))}
              </div>
              <p className="mt-3 px-1 text-xs font-medium text-inksoft">
                Zorluk puanı: {score.earned} / {score.total}
              </p>
            </>
          )}
        </section>

        <SuggestionsCard existingNames={list.map((h) => h.name)} onAdd={addSuggestion} />

        <ScheduleCard
          items={scheduleItems}
          today={today}
          onToggle={(id) => toggleDone(id, today)}
          onEdit={(item) => setPlanSheet({ open: true, item })}
          onAdd={() => setPlanSheet({ open: true })}
        />

        <ReminderBanner permission={permission} onRequest={request} />

        <WeekCard habits={list} today={today} allDone={allDone} />

        <p className="pb-2 text-center text-xs font-medium text-inksoft/70">
          Tüm veriler bu cihazda kalır · Hesap yok · Bulut yok
        </p>
      </main>

      {sheet.open && (
        <HabitSheet
          key={sheet.habit?.id ?? "new"}
          habit={sheet.habit}
          onClose={() => setSheet({ open: false })}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {planSheet.open && (
        <ScheduleSheet
          key={planSheet.item?.id ?? "new-plan"}
          item={planSheet.item}
          onClose={() => setPlanSheet({ open: false })}
          onSave={handlePlanSave}
          onDelete={(id) => {
            removeItem(id);
            setPlanSheet({ open: false });
          }}
        />
      )}
    </div>
  );
}
