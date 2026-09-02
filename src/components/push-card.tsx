import type { PushStatus } from "@/lib/push";

type Props = {
  enabled: boolean;
  ongoing: boolean;
  status: PushStatus;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
  onToggleOngoing: () => void;
  onTest: () => void;
};

const messages: Record<PushStatus, string | null> = {
  idle: null,
  registered: null,
  "not-configured": "Bildirim servisi henüz yapılandırılmadı.",
  unsupported: "Bu tarayıcı push bildirimlerini desteklemiyor.",
  "open-in-new-tab": "Önizleme çerçevesinde izin verilemiyor — uygulamayı ayrı sekmede aç.",
  denied: "İzin verilmedi. Tarayıcı site ayarlarından bildirimlere izin verebilirsin.",
};

export function PushCard({
  enabled,
  ongoing,
  status,
  busy,
  onEnable,
  onDisable,
  onToggleOngoing,
  onTest,
}: Props) {
  const note = messages[status];

  return (
    <section className="glass rounded-3xl border border-white/60 p-5 shadow-md shadow-brand/10">
      <div className="flex items-start gap-3">
        <span className="text-xl">🔔</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
            Push bildirimleri
          </h2>
          <p className="mt-1 text-xs font-medium text-inksoft">
            {enabled
              ? "Uygulama kapalıyken bile program saatlerinde bildirim alırsın."
              : "Uygulama kapalıyken bile hatırlatma almak için aç."}
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
        <>
          <button
            type="button"
            onClick={onToggleOngoing}
            aria-pressed={ongoing}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white/50 px-3.5 py-3 text-left ring-1 ring-white/70 transition-colors hover:bg-white/70"
          >
            <span
              className={`grid h-6 w-11 shrink-0 place-items-start rounded-full p-0.5 transition-colors ${
                ongoing ? "bg-brand" : "bg-inksoft/25"
              }`}
            >
              <span
                className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
                  ongoing ? "translate-x-5" : ""
                }`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-ink">
                Canlı “şu an” bildirimi
              </span>
              <span className="block text-[11px] font-medium text-inksoft">
                Bildirim panosunda sabit kalır ve o anki program bloğunu gösterir (Android).
              </span>
            </span>
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onTest}
            className="mt-3 w-full rounded-full bg-brand/10 px-4 py-2 text-xs font-semibold text-brand ring-1 ring-brand/30 active:scale-95 disabled:opacity-60"
          >
            Test bildirimi gönder
          </button>
        </>
      )}

      {note && <p className="mt-3 text-[11px] font-medium text-inksoft">{note}</p>}
    </section>
  );
}
