/**
 * WebRTCシグナリング用のDurable Object
 * セッションルームごとにインスタンスが作成され、参加者間のシグナリングメッセージを中継
 */
export class SignalingRoom implements DurableObject {
	private state: DurableObjectState;
	private sessions: Map<
		WebSocket,
		{ userId: string; role: "partner" | "user" }
	>;

	constructor(state: DurableObjectState, _env: unknown) {
		this.state = state;
		this.sessions = new Map();
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// WebSocketアップグレード
		if (request.headers.get("Upgrade") === "websocket") {
			const { userId, role } = this.parseQueryParams(url);

			if (!userId || !role) {
				return new Response("Missing userId or role", { status: 400 });
			}

			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			// WebSocketセッションを受け入れる
			this.state.acceptWebSocket(server);

			// ユーザー情報を保存
			this.sessions.set(server, { userId, role });

			// 他の参加者に新しい参加者を通知
			this.broadcast(
				{
					type: "user-joined",
					userId,
					role,
				},
				server,
			);

			return new Response(null, {
				status: 101,
				webSocket: client,
			});
		}

		return new Response("Expected WebSocket", { status: 400 });
	}

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
		try {
			if (typeof message !== "string") {
				return;
			}

			const data = JSON.parse(message);
			const sender = this.sessions.get(ws);

			if (!sender) {
				return;
			}

			// シグナリングメッセージの種類に応じて処理
			switch (data.type) {
				case "offer":
				case "answer":
				case "ice-candidate":
					// 相手にメッセージを転送
					this.broadcast(
						{
							...data,
							from: sender.userId,
							fromRole: sender.role,
						},
						ws,
					);
					break;

				default:
					console.log("Unknown message type:", data.type);
			}
		} catch (error) {
			console.error("Error processing WebSocket message:", error);
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		const user = this.sessions.get(ws);

		if (user) {
			// 他の参加者に退出を通知
			this.broadcast(
				{
					type: "user-left",
					userId: user.userId,
					role: user.role,
				},
				ws,
			);

			this.sessions.delete(ws);
		}

		ws.close(code, reason);
	}

	/**
	 * 他の参加者にメッセージをブロードキャスト
	 */
	private broadcast(message: unknown, exclude?: WebSocket) {
		const data = JSON.stringify(message);

		for (const [socket, _] of this.sessions) {
			if (socket !== exclude) {
				try {
					socket.send(data);
				} catch (error) {
					console.error("Error broadcasting message:", error);
				}
			}
		}
	}

	/**
	 * URLクエリパラメータを解析
	 */
	private parseQueryParams(url: URL): {
		userId: string;
		role: "partner" | "user";
	} {
		const userId = url.searchParams.get("userId") || "";
		const role = url.searchParams.get("role") as "partner" | "user";

		return { userId, role };
	}
}
