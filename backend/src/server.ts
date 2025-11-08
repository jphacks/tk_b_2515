/**
 * サーバーエントリーポイント
 *
 * Node.js HTTPサーバーとWebSocketシグナリングサーバーを起動します。
 * Honoアプリケーションと統合し、REST APIとWebSocketを同じポートで提供します。
 */
import { createServer, type IncomingMessage } from "node:http";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
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
	// GET/HEAD 以外では Node.js のリクエストストリームをそのまま Fetch API に渡す
	const isBodyAllowed = req.method
		? !["GET", "HEAD"].includes(req.method.toUpperCase())
		: false;

	const handleRequest = async (bodySource?: IncomingMessage) => {
		try {
			// NodeのIncomingMessageをそのままReadableとして渡す（multipart FormData対応）
			const requestInit: RequestInit & { duplex?: "half" } = {
				method: req.method,
				headers: req.headers as HeadersInit,
				body:
					isBodyAllowed && bodySource
						? (Readable.toWeb(bodySource) as unknown as BodyInit)
						: undefined,
				// Node.js固有: Readableをfetchに渡す際のduplex指定
				...(isBodyAllowed ? { duplex: "half" as const } : {}),
			};

			const request = new Request(
				`http://${req.headers.host}${req.url}`,
				requestInit,
			);

			const response = await app.fetch(request);

			res.writeHead(response.status, Object.fromEntries(response.headers));

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
		} catch (e) {
			console.error("Server request handling error:", e);
			res.writeHead(500, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Server request handling error" }));
		}
	};

	await handleRequest(isBodyAllowed ? req : undefined);
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
