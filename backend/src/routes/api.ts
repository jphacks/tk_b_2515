/**
 * APIルーターの統合管理
 *
 * このファイルでは、全てのAPIエンドポイントをまとめて管理します。
 * 各機能ごとにルートモジュールを分割し、/api 配下にマウントします。
 */
import { createRoute, z } from "@hono/zod-openapi";

// ルートモジュールのインポート
import authRoutes from "./modules/auth.routes";
import conversationRoutes from "./modules/conversation.routes";
import feedbackRoutes from "./modules/feedback.routes";
import messagesRoutes from "./modules/messages.routes";
import partnersRoutes from "./modules/partners.routes";
import sessionsRoutes from "./modules/sessions.routes";
import speechRoutes from "./modules/speech.routes";
import { createApiRoute } from "./utils";

// APIルーターを作成
const api = createApiRoute();

/**
 * ヘルスチェックエンドポイント
 * GET /api/health
 * APIサーバーの稼働状態を確認します
 */
const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	responses: {
		200: {
			description: "API is healthy",
			content: {
				"application/json": {
					schema: z.object({
						status: z.string().openapi({ example: "ok" }),
					}),
				},
			},
		},
	},
});

api.openapi(healthRoute, (c) => {
	return c.json({ status: "ok" });
});

/**
 * ルートモジュールをマウント
 *
 * 各ルートは以下のように構成されます：
 * - /auth: 認証関連（サインアップ、ログイン等）
 * - /sessions: セッション管理、メッセージ、フィードバック
 * - /conversation: AI会話生成とフィードバック
 * - /speech: STT/TTS機能
 * - /partners: パートナー管理
 */
[
	{ basePath: "/auth", router: authRoutes },
	{ basePath: "/sessions", router: sessionsRoutes },
	{ basePath: "/sessions", router: messagesRoutes },
	{ basePath: "/sessions", router: feedbackRoutes },
	{ basePath: "/conversation", router: conversationRoutes },
	{ basePath: "/", router: speechRoutes },
	{ basePath: "/partners", router: partnersRoutes },
].forEach(({ basePath, router }) => {
	api.route(basePath, router);
});

export default api;
