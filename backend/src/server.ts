import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import app from "./index";
import { SignalingServer } from "./services/signaling-node";

// Load .env from project root (parent directory of backend)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../../.env") });

const port = Number(process.env.PORT) || 8787;
console.log(process.env.NEXT_PUBLIC_API_URL);

// HTTPサーバーを作成
const server = createServer(async (req, res) => {
	// Honoアプリケーションにリクエストを渡す
	const response = await app.fetch(
		new Request(`http://${req.headers.host}${req.url}`, {
			method: req.method,
			headers: req.headers as HeadersInit,
		}),
	);

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
});

// WebSocketシグナリングサーバーを初期化
new SignalingServer(server);

server.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
	console.log(`WebSocket signaling available at ws://localhost:${port}/ws/signal/:sessionId`);
});
