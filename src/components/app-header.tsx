type Props = {
  today: Date;
  bestCurrentStreak: number;
};

export function AppHeader({ today, bestCurrentStreak }: Props) {
  const hour = today.getHours();
  const greeting = hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const dateLabel = new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);
  const capitalized = dateLabel.charAt(0).toLocaleUpperCase("tr-TR") + dateLabel.slice(1);

  return (
    <header className="glass flex items-center justify-between rounded-3xl border border-white/60 px-5 py-4 shadow-lg shadow-brand/10">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-inksoft">Momentum</p>
        <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight text-ink">
          {greeting}
        </h1>
        <p className="mt-0.5 text-xs font-medium text-inksoft">{capitalized}</p>
      </div>
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/70 ring-1 ring-black/5">
        <div className="flex flex-col items-center leading-none">
          <span className="text-xl">🔥</span>
          <span className="mt-0.5 font-display text-sm font-bold text-brand">{bestCurrentStreak}</span>
        </div>
      </div>
    </header>
  );
}