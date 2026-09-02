/** Sunucu tarafı: Lovable connector gateway üzerinden FCM gönderimi. */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export type PushPayload = {
  kind: "alert" | "ongoing";
  title: string;
  body: string;
  tag?: string;
};

export type SendResult = { ok: true } | { ok: false; stale: boolean; status: number; text: string };

export async function sendPush(token: string, payload: PushPayload): Promise<SendResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey || !connectionKey) {
    return { ok: false, stale: false, status: 500, text: "Bildirim bağlantısı yapılandırılmamış" };
  }

  const data: Record<string, string> = {
    kind: payload.kind,
    title: payload.title,
    body: payload.body,
  };
  if (payload.tag) data["tag"] = payload.tag;

  const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        data,
        webpush: {
          headers: { Urgency: payload.kind === "ongoing" ? "normal" : "high", TTL: "600" },
        },
      },
    }),
  });

  if (res.ok) return { ok: true };
  const text = await res.text();
  console.error(`FCM send failed [${res.status}]: ${text}`);
  const stale =
    res.status === 404 ||
    (res.status === 400 && text.includes("INVALID_ARGUMENT")) ||
    res.status === 403;
  return { ok: false, stale, status: res.status, text };
}
