/**
 * Agora RTC Token Generation Routes
 *
 * Provides endpoints for generating Agora RTC tokens for WebRTC video calling.
 * Tokens are required for clients to join Agora channels securely.
 */
import { z } from "@hono/zod-openapi";
import agoraToken from "agora-token";
import { createApiRoute } from "../utils";

const { RtcRole, RtcTokenBuilder } = agoraToken;

const agora = createApiRoute();

/**
 * Token generation request schema
 */
const tokenRequestSchema = z.object({
	channelName: z.string().min(1).max(64).describe("Channel name (session ID)"),
	userId: z.string().min(1).describe("User ID"),
	role: z.enum(["user", "partner"]).describe("User role in the session"),
});

/**
 * Generate Agora RTC token
 * POST /api/agora/token
 *
 * Creates a temporary token for joining an Agora channel.
 * Tokens expire after 24 hours.
 */
agora.post("/token", async (c) => {
	try {
		const body = await c.req.json();
		const parsed = tokenRequestSchema.safeParse(body);

		if (!parsed.success) {
			return c.json(
				{
					error: "Invalid request body",
					details: parsed.error.issues,
				},
				400,
			);
		}

		const { channelName, userId } = parsed.data;

		// 環境変数からAgora認証情報を取得
		const appId =
			process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
		const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";

		if (!appId || !appCertificate) {
			console.error("[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE");
			return c.json(
				{
					error: "Agora configuration not found",
				},
				500,
			);
		}

		// userIdを数値に変換（Agoraは0または正の整数を要求）
		// ハッシュ関数を使用してuserIdから一意の数値を生成
		const uid = Math.abs(hashString(userId)) % 2147483647; // 32-bit signed int max

		// トークン有効期限: 24時間
		const expirationTimeInSeconds = 86400;
		const currentTimestamp = Math.floor(Date.now() / 1000);
		const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

		// RTC tokenを生成
		// RtcRole.PUBLISHER: 音声・映像の送受信が可能
		const token = RtcTokenBuilder.buildTokenWithUid(
			appId,
			appCertificate,
			channelName,
			uid,
			RtcRole.PUBLISHER,
			expirationTimeInSeconds, // tokenExpire
			privilegeExpiredTs, // privilegeExpire
		);

		console.log(
			`[Agora] Generated token for user ${userId} (uid: ${uid}) in channel ${channelName}`,
		);

		return c.json(
			{
				token,
				appId,
				channelName,
				uid,
				expiresIn: expirationTimeInSeconds,
			},
			200,
		);
	} catch (error) {
		console.error("[Agora] Token generation error:", error);
		return c.json(
			{
				error: "Failed to generate token",
			},
			500,
		);
	}
});

/**
 * Simple hash function to convert string to positive integer
 * Used to generate consistent numeric UIDs from string user IDs
 */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return hash;
}

export default agora;
