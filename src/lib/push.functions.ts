import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  id: z.string().min(1).max(64),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .optional(),
  title: z.string().min(1).max(120),
  remind: z.boolean(),
});

const registerSchema = z.object({
  deviceId: z.string().uuid(),
  token: z.string().min(20).max(4096),
  tzOffset: z.number().int().min(-840).max(840),
  ongoing: z.boolean(),
  items: z.array(itemSchema).max(50),
});

export const registerPushDevice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => registerSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("push_devices").upsert(
      {
        device_id: data.deviceId,
        token: data.token,
        tz_offset: data.tzOffset,
        ongoing_enabled: data.ongoing,
        items: data.items,
      },
      { onConflict: "device_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const syncSchema = z.object({
  deviceId: z.string().uuid(),
  tzOffset: z.number().int().min(-840).max(840),
  ongoing: z.boolean(),
  items: z.array(itemSchema).max(50),
});

export const syncPushSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => syncSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("push_devices")
      .update({
        tz_offset: data.tzOffset,
        ongoing_enabled: data.ongoing,
        items: data.items,
      })
      .eq("device_id", data.deviceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deviceSchema = z.object({ deviceId: z.string().uuid() });

export const disablePushDevice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deviceSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("push_devices").delete().eq("device_id", data.deviceId);
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deviceSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("push_devices")
      .select("token")
      .eq("device_id", data.deviceId)
      .maybeSingle();
    if (!row?.token) return { ok: false, message: "Cihaz kayıtlı değil" };

    const { sendPush } = await import("@/lib/fcm.server");
    const result = await sendPush(row.token, {
      kind: "alert",
      title: "Momentum",
      body: "Bildirimler çalışıyor 🎉",
      tag: "momentum-test",
    });
    return result.ok ? { ok: true } : { ok: false, message: "Bildirim gönderilemedi" };
  });
