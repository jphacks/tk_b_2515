/**
 * Node.js用のWebRTCシグナリングサーバー
 *
 * WebSocketを使用してクライアント間のシグナリングメッセージを中継します。
 * WebRTC接続を確立するために必要なoffer/answer/ICE候補の交換を管理します。
 *
 * @example
 * // クライアント接続URL
 * ws://localhost:8787/ws/signal/:sessionId?userId=user123&role=user
 */
import type { Server } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer } from "ws";
import type WebSocket from "ws";

/**
 * WebSocket接続のクライアント情報
 */
interface ClientInfo {
	userId: string;
	role: "partner" | "user";
	sessionId: string;
}

/**
 * シグナリングメッセージの型定義
 */
interface SignalingMessage {
	type: string;
	[key: string]: unknown;
}

/**
 * WebSocketシグナリングサーバー
 * セッションごとにクライアントを管理し、メッセージを中継します
 */
export class SignalingServer {
	private wss: WebSocketServer;
	private sessions: Map<string, Map<WebSocket, ClientInfo>>;

	constructor(server: Server) {
		this.wss = new WebSocketServer({ noServer: true });
		this.sessions = new Map();

		server.on(
			"upgrade",
			(request: IncomingMessage, socket: Duplex, head: Buffer) => {
				const url = new URL(
					request.url || "",
					`http://${request.headers.host}`,
				);
				const pathname = url.pathname;

				// /ws/signal/:sessionId へのリクエストのみ処理
				if (pathname.startsWith("/ws/signal/")) {
					this.wss.handleUpgrade(request, socket, head, (ws) => {
						this.handleConnection(ws, url);
					});
				} else {
					socket.destroy();
				}
			},
		);
	}

	private handleConnection(ws: WebSocket, url: URL) {
		const pathname = url.pathname;
		const sessionId = pathname.split("/ws/signal/")[1];
		const userId = url.searchParams.get("userId") || "";
		const role = url.searchParams.get("role") as "partner" | "user";

		if (!userId || !role || !sessionId) {
			ws.close(1008, "Missing userId, role or sessionId");
			return;
		}

		// セッションのクライアントマップを取得または作成
		if (!this.sessions.has(sessionId)) {
			this.sessions.set(sessionId, new Map());
		}
		const sessionClients = this.sessions.get(sessionId);
		if (!sessionClients) return;

		// クライアント情報を保存
		const clientInfo: ClientInfo = { userId, role, sessionId };
		sessionClients.set(ws, clientInfo);

		console.log(
			`[Signaling] User ${userId} (${role}) joined session ${sessionId}`,
		);
		console.log(
			`[Signaling] Session ${sessionId} now has ${sessionClients.size} participants`,
		);

		// 既存の参加者に新しい参加者を通知
		this.broadcast(
			sessionId,
			{
				type: "user-joined",
				userId,
				role,
			},
			ws,
		);

		// 新しく参加した人に、既存の参加者を通知（ready message）
		// これにより、partnerが後から参加した場合でもofferを送信できる
		if (sessionClients.size > 1) {
			try {
				ws.send(
					JSON.stringify({
						type: "ready",
						participantCount: sessionClients.size,
					}),
				);
				console.log(`[Signaling] Sent ready message to ${userId} (${role})`);
			} catch (error) {
				console.error("[Signaling] Error sending ready message:", error);
			}
		}

		// メッセージハンドラー
		ws.on("message", (data) => {
			try {
				const message = JSON.parse(data.toString());
				this.handleMessage(ws, sessionId, clientInfo, message);
			} catch (error) {
				console.error("[Signaling] Error parsing message:", error);
			}
		});

		// 切断ハンドラー
		ws.on("close", () => {
			console.log(
				`[Signaling] User ${userId} (${role}) left session ${sessionId}`,
			);
			this.handleDisconnect(ws, sessionId, clientInfo);
		});

		// エラーハンドラー
		ws.on("error", (error) => {
			console.error(`[Signaling] WebSocket error for ${userId}:`, error);
		});
	}

	private handleMessage(
		ws: WebSocket,
		sessionId: string,
		sender: ClientInfo,
		message: SignalingMessage,
	) {
		// シグナリングメッセージの種類に応じて処理
		switch (message.type) {
			case "offer":
			case "answer":
			case "ice-candidate":
				// 相手にメッセージを転送
				this.broadcast(
					sessionId,
					{
						...message,
						from: sender.userId,
						fromRole: sender.role,
					},
					ws,
				);
				break;

			default:
				console.log("[Signaling] Unknown message type:", message.type);
		}
	}

	private handleDisconnect(
		ws: WebSocket,
		sessionId: string,
		clientInfo: ClientInfo,
	) {
		const sessionClients = this.sessions.get(sessionId);
		if (!sessionClients) return;

		// 他の参加者に退出を通知
		this.broadcast(
			sessionId,
			{
				type: "user-left",
				userId: clientInfo.userId,
				role: clientInfo.role,
			},
			ws,
		);

		// クライアントを削除
		sessionClients.delete(ws);

		// セッションが空になったら削除
		if (sessionClients.size === 0) {
			this.sessions.delete(sessionId);
			console.log(`[Signaling] Session ${sessionId} cleaned up`);
		}
	}

	/**
	 * セッション内の他の参加者にメッセージをブロードキャスト
	 */
	private broadcast(
		sessionId: string,
		message: SignalingMessage,
		exclude?: WebSocket,
	) {
		const sessionClients = this.sessions.get(sessionId);
		if (!sessionClients) return;

		const data = JSON.stringify(message);

		for (const [client, _] of sessionClients) {
			if (client !== exclude && client.readyState === 1) {
				// OPEN
				try {
					client.send(data);
				} catch (error) {
					console.error("[Signaling] Error broadcasting message:", error);
				}
			}
		}
	}
}
