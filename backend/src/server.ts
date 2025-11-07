/**
 * サーバーエントリーポイント
 *
 * Node.js HTTPサーバーとWebSocketシグナリングサーバーを起動します。
 * Honoアプリケーションと統合し、REST APIとWebSocketを同じポートで提供します。
 */
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import app from "./index";
import { SignalingServer } from "./services/signaling-node";

// プロジェクトルートの.envファイルをロード
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../.env") });

const port = Number(process.env.PORT) || 8787;

/**
 * HTTPサーバーを作成
 * HonoアプリケーションをNode.js HTTPサーバーと統合します
 */
const server = createServer(async (req, res) => {
	// HonoアプリケーションにリクエストをFetch APIリクエストに変換して渡す
	const response = await app.fetch(
		new Request(`http://${req.headers.host}${req.url}`, {
			method: req.method,
			headers: req.headers as HeadersInit,
		}),
	);

	// レスポンスヘッダーを設定
	res.writeHead(response.status, Object.fromEntries(response.headers));

	// レスポンスボディをストリーミング
	if (response.body) {
		const reader = response.body.getReader();
		const pump = async (): Promise<void> => {
			const { done, value } = await reader.read();
			if (done) {
				res.end();
				return;
			}
			res.write(value);
			return pump();
		};
		await pump();
	} else {
		res.end();
	}
});

/**
 * WebSocketシグナリングサーバーを初期化
 * WebRTC接続用のシグナリングメッセージを中継します
 */
new SignalingServer(server);

/**
 * サーバーを起動
 */
server.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
	console.log(`WebSocket signaling available at ws://localhost:${port}/ws/signal/:sessionId`);
});
