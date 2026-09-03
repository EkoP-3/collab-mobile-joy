import { createFileRoute } from "@tanstack/react-router";

type Item = { id: string; start: string; end?: string; title: string; remind: boolean };

type DeviceRow = {
  device_id: string;
  token: string;
  tz_offset: number;
  items: Item[] | null;
  ongoing_enabled: boolean;
  last_ongoing: string | null;
  sent_keys: string[] | null;
};

function toMinutes(t: string): number {
  const [h, m] = t.split(":");
  return Number(h ?? 0) * 60 + Number(m ?? 0);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Cihazın yerel saatine göre gün anahtarı ve dakika. */
function localNow(tzOffset: number): { dayKey: string; minutes: number } {
  const shifted = new Date(Date.now() + tzOffset * 60_000);
  return {
    dayKey: `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** Şu anki blok ve sıradaki blok için "canlı" bildirim metni. */
function ongoingText(items: Item[], minutes: number): { title: string; body: string } | null {
  const sorted = sortItems(items);
  if (sorted.length === 0) return null;

  let current: Item | undefined;
  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i]!;
    const start = toMinutes(cur.start);
    const end = cur.end ? toMinutes(cur.end) : toMinutes(sorted[i + 1]?.start ?? "23:59");
    if (minutes >= start && minutes < end) {
      current = cur;
      break;
    }
  }
  const next = sorted.find((i) => toMinutes(i.start) > minutes);
  const clock = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

  if (current) {
    return {
      title: `${clock} · ${current.title}`,
      body: next ? `Sırada ${next.start} · ${next.title}` : "Günün son bloğu",
    };
  }
  if (next) {
    return { title: `${clock} · Serbest zaman`, body: `Sırada ${next.start} · ${next.title}` };
  }
  return { title: `${clock} · Program tamam`, body: "Bugünlük planın bitti" };
}

export const Route = createFileRoute("/api/public/hooks/push-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PUSH_TICK_TOKEN"];
        if (!secret || request.headers.get("x-cron-secret") !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPush } = await import("@/lib/fcm.server");

        const { data: devices, error } = await supabaseAdmin
          .from("push_devices")
          .select("device_id, token, tz_offset, items, ongoing_enabled, last_ongoing, sent_keys");
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        let alerts = 0;
        let ongoing = 0;

        for (const device of (devices ?? []) as DeviceRow[]) {
          const items = Array.isArray(device.items) ? device.items : [];
          const { dayKey, minutes } = localNow(device.tz_offset);
          const todaysKeys = (device.sent_keys ?? []).filter((k) => k.startsWith(dayKey));
          const newKeys: string[] = [];
          let stale = false;

          for (const item of items) {
            if (!item.remind) continue;
            const start = toMinutes(item.start);
            if (minutes < start || minutes > start + 1) continue;
            const key = `${dayKey}-${item.id}`;
            if (todaysKeys.includes(key) || newKeys.includes(key)) continue;
            const result = await sendPush(device.token, {
              kind: "alert",
              title: `${item.start} · ${item.title}`,
              body: "Sıradaki görevin başlıyor",
              tag: key,
            });
            if (result.ok) {
              newKeys.push(key);
              alerts++;
            } else if (result.stale) {
              stale = true;
              break;
            }
          }

          if (stale) {
            await supabaseAdmin.from("push_devices").delete().eq("device_id", device.device_id);
            continue;
          }

          const update: { sent_keys?: string[]; last_ongoing?: string } = {};
          if (newKeys.length > 0) update.sent_keys = [...todaysKeys, ...newKeys];

          if (device.ongoing_enabled) {
            const text = ongoingText(items, minutes);
            const signature = text ? `${text.title}|${text.body}` : "";
            if (text && signature !== device.last_ongoing) {
              const result = await sendPush(device.token, { kind: "ongoing", ...text });
              if (result.ok) {
                update.last_ongoing = signature;
                ongoing++;
              } else if (result.stale) {
                await supabaseAdmin
                  .from("push_devices")
                  .delete()
                  .eq("device_id", device.device_id);
                continue;
              }
            }
          }

          if (Object.keys(update).length > 0) {
            await supabaseAdmin
              .from("push_devices")
              .update(update)
              .eq("device_id", device.device_id);
          }
        }

        return new Response(JSON.stringify({ ok: true, alerts, ongoing }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
