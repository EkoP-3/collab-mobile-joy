import type { OngoingStatus } from "@/lib/ongoing";

type Props = {
  enabled: boolean;
  ongoing: boolean;
  reminders: boolean;
  status: OngoingStatus | null;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onToggleOngoing: () => void;
  onToggleReminders: () => void;
  onOpenNotificationSettings: () => void;
  onOpenExactAlarmSettings: () => void;
};

function Row({
  on,
  title,
  hint,
  onClick,
}: {
  on: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="flex w-full items-center gap-3 rounded-2xl bg-white/50 px-3.5 py-3 text-left ring-1 ring-white/70 transition-colors hover:bg-white/70"
    >
      <span
        className={`grid h-6 w-11 shrink-0 place-items-start rounded-full p-0.5 transition-colors ${
          on ? "bg-brand" : "bg-inksoft/25"
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-ink">{title}</span>
        <span className="block text-[11px] font-medium text-inksoft">{hint}</span>
      </span>
    </button>
  );
}

/** Yalnızca Android uygulamasında gösterilir. */
export function NotificationCard({
  enabled,
  ongoing,
  reminders,
  status,
  busy,
  onEnable,
  onDisable,
  onToggleOngoing,
  onToggleReminders,
  onOpenNotificationSettings,
  onOpenExactAlarmSettings,
}: Props) {
  const blocked = status !== null && !status.notifications;
  const inexact = enabled && status !== null && !status.exactAlarms;

  return (
    <section className="glass rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔔</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Bildirimler
          </h2>
          <p className="mt-1 text-xs font-medium text-inksoft">
            {enabled
              ? "Program bildirim panosunda sabit kalır; uygulama kapalıyken de çalışır."
              : "Bildirim panosunda şu an hangi bloktasın ve sırada ne var, hep göz önünde olsun."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={enabled ? onDisable : onEnable}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 ${
            enabled
              ? "bg-brand/10 text-brand ring-1 ring-brand/30"
              : "bg-brand text-white shadow-md shadow-brand/30"
          }`}
        >
          {enabled ? "Kapat" : "Aç"}
        </button>
      </div>

      {enabled && (
        <div className="mt-4 flex flex-col gap-2">
          <Row
            on={ongoing}
            title="Canlı “şu an” bildirimi"
            hint="O anki bloğu, kalan süreyi ve sıradakini gösterir."
            onClick={onToggleOngoing}
          />
          <Row
            on={reminders}
            title="Görev hatırlatıcıları"
            hint="Hatırlatıcısı açık görevler başlarken bildirim gelir."
            onClick={onToggleReminders}
          />
        </div>
      )}

      {blocked && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/50 px-3.5 py-3 ring-1 ring-white/70">
          <p className="min-w-0 flex-1 text-[11px] font-medium text-inksoft">
            Bildirim izni kapalı. Telefon ayarlarından açman gerekiyor.
          </p>
          <button
            type="button"
            onClick={onOpenNotificationSettings}
            className="shrink-0 rounded-full bg-brand px-3.5 py-1.5 text-[11px] font-semibold text-white active:scale-95"
          >
            Ayarları aç
          </button>
        </div>
      )}

      {inexact && !blocked && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/50 px-3.5 py-3 ring-1 ring-white/70">
          <p className="min-w-0 flex-1 text-[11px] font-medium text-inksoft">
            Tam zamanlı alarm izni kapalı; bildirimler birkaç dakika geç gelebilir.
          </p>
          <button
            type="button"
            onClick={onOpenExactAlarmSettings}
            className="shrink-0 rounded-full bg-brand/10 px-3.5 py-1.5 text-[11px] font-semibold text-brand ring-1 ring-brand/30 active:scale-95"
          >
            İzin ver
          </button>
        </div>
      )}
    </section>
  );
}
