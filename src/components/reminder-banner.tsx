import type { PermissionState } from "@/hooks/use-reminders";

type Props = {
  permission: PermissionState;
  onRequest: () => void;
};

export function ReminderBanner({ permission, onRequest }: Props) {
  if (permission === "granted" || permission === "unsupported") return null;

  const text =
    permission === "denied"
      ? "Bildirimler tarayıcı ayarlarından engellenmiş. Site ayarlarından izin verebilirsin."
      : permission === "iframe"
        ? "Hatırlatıcılar için uygulamayı ayrı bir sekmede aç, sonra izin ver."
        : "Program saatlerinde hatırlatma almak ister misin? Bildirimler cihazında kalır.";

  return (
    <section className="glass-soft flex items-center gap-3 rounded-2xl border border-white/60 p-4 shadow-md shadow-brand/10">
      <span className="text-xl">🔔</span>
      <p className="min-w-0 flex-1 text-xs font-medium text-inksoft">{text}</p>
      {permission === "default" && (
        <button
          type="button"
          onClick={onRequest}
          className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-md shadow-brand/30 active:scale-95"
        >
          İzin ver
        </button>
      )}
    </section>
  );
}
