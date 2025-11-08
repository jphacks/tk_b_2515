import { z } from "@hono/zod-openapi";
import { createApiRoute } from "../utils";

// CJS export; TS may not have types available
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// "agora-access-token" は CJS 形式で公開されており、環境によっては名前付きエクスポートが解決できない場合がある
// そのためデフォルトインポートしてからプロパティを参照する方式に変更
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import AgoraAccessToken from "agora-access-token";

const agora = createApiRoute();

const tokenRequestSchema = z.object({
  channel: z.string().min(1),
  uid: z.string().optional(),
  role: z.enum(["publisher", "audience"]).optional().default("publisher"),
  expireSeconds: z.number().int().min(60).max(24 * 60 * 60).optional().default(60 * 60),
});

agora.post("/token", async (c) => {
  try {
    const parsed = tokenRequestSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) {
      return c.json({ error: "Invalid payload" }, 400);
    }

    const { channel, uid, role, expireSeconds } = parsed.data;

    const appId = process.env.AGORA_APP_ID || "";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";

    if (!appId || !appCertificate) {
      return c.json({ error: "Agora credentials are not configured" }, 500);
    }

    const now = Math.floor(Date.now() / 1000);
    const expireAt = now + (expireSeconds ?? 3600);

    // ライブラリ側のエクスポート差異に対応
    // CJS: module.exports = { RtcTokenBuilder, RtcRole }
    // ESM 側ではデフォルトにぶら下がることがあるため動的参照する
    const RtcTokenBuilder = (AgoraAccessToken as any).RtcTokenBuilder ?? (AgoraAccessToken as any).default?.RtcTokenBuilder;
    const RtcRole = (AgoraAccessToken as any).RtcRole ?? (AgoraAccessToken as any).default?.RtcRole;

    // それでも未定義の場合は数値ロールでフォールバック（1: PUBLISHER, 2: SUBSCRIBER）
    const RTC_ROLE = {
      PUBLISHER: RtcRole?.PUBLISHER ?? 1,
      SUBSCRIBER: RtcRole?.SUBSCRIBER ?? 2,
    } as const;

    const rtcRole = role === "publisher" ? RTC_ROLE.PUBLISHER : RTC_ROLE.SUBSCRIBER;

    // We use string account for flexibility
    // Ensure account is a concrete string
    const account: string = (() => {
      if (uid && uid.length > 0) return uid;
      try {
        // Prefer Web Crypto if available, fallback to timestamp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = globalThis as any;
        if (g.crypto && typeof g.crypto.randomUUID === "function") {
          return g.crypto.randomUUID();
        }
      } catch {}
      return `u_${Date.now()}`;
    })();

    const token = RtcTokenBuilder.buildTokenWithAccount(
      appId,
      appCertificate,
      channel,
      account,
      rtcRole,
      expireAt,
    );

    return c.json({ appId, channel, uid: account, token, expireAt });
  } catch (err) {
    console.error("[Agora] Failed to issue token:", err);
    return c.json({ error: "Failed to issue token" }, 500);
  }
});

export default agora;
