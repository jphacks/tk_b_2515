/**
 * WebRTCビデオ通話セッションページ
 *
 * 1対1のビデオ通話機能を提供します。
 * WebRTC（getUserMedia + RTCPeerConnection）を使用して、
 * ブラウザ間で直接ビデオ・音声通信を行います。
 *
 * 主な機能：
 * - カメラとマイクへのアクセス
 * - WebSocketシグナリングサーバーを介した接続確立
 * - ビデオ・オーディオのオン/オフ切り替え
 * - 通話時間のカウント
 * - 通話終了後のフィードバックページへの遷移
 */
"use client";

import { Heart, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

const SIGNALING_SERVER_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export default function SessionRoomPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const sessionId = params.sessionId as string;

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [_remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const iceCandidatesQueueRef = useRef<RTCIceCandidate[]>([]);

	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");
	const [callDuration, setCallDuration] = useState(0);
	const [userRole, setUserRole] = useState<"user" | "partner" | null>(null);
	const [userId, setUserId] = useState<string>("");

	// URLパラメータからroleを取得し、userIdを初期化
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const role = params.get("role") as "user" | "partner" | null;
			setUserRole(role || "user");
		} else {
			setUserRole("user");
		}

		// userIdを一度だけ生成（sessionがない場合）
		if (!userId) {
			const id =
				session?.user?.id || `user-${Math.random().toString(36).substring(7)}`;
			setUserId(id);
			console.log("[WebRTC] Generated userId:", id);
		}
	}, [session?.user?.id, userId]);

	const role = userRole || "user";

	// カメラとマイクの初期化
	useEffect(() => {
		let isMounted = true;
		let activeStream: MediaStream | null = null;

		const initMedia = async () => {
			try {
				console.log("[WebRTC] Requesting camera and microphone access...");
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: true,
				});

				if (!isMounted) {
					for (const track of stream.getTracks()) {
						track.stop();
					}
					return;
				}

				console.log("[WebRTC] Media devices accessed successfully");
				activeStream = stream;
				setLocalStream(stream);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
			} catch (error) {
				console.error("[WebRTC] Error accessing media devices:", error);
				alert("カメラまたはマイクへのアクセスに失敗しました");
			}
		};

		initMedia();

		return () => {
			isMounted = false;
			if (activeStream) {
				for (const track of activeStream.getTracks()) {
					track.stop();
				}
			}
		};
	}, []);

	// WebRTC接続の初期化
	useEffect(() => {
		if (!localStream || !userId || !role) {
			console.log("[WebRTC] Waiting for localStream, userId, and role...", {
				localStream: !!localStream,
				userId,
				role,
			});
			return;
		}

		console.log("[WebRTC] Initializing WebRTC connection...");
		console.log("[WebRTC] User ID:", userId);
		console.log("[WebRTC] Role:", role);
		console.log("[WebRTC] Session ID:", sessionId);

		const currentSessionId = sessionId;
		const currentRole = role;
		const currentUserId = userId;

		const initWebRTC = async () => {
			// RTCPeerConnection作成
			const peerConnection = new RTCPeerConnection({
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
				],
			});

			peerConnectionRef.current = peerConnection;

			// ローカルストリームを追加
			localStream.getTracks().forEach((track) => {
				peerConnection.addTrack(track, localStream);
			});
			console.log("[WebRTC] Added local tracks to peer connection");

			// リモートストリームの受信
			peerConnection.ontrack = (event) => {
				console.log("[WebRTC] Received remote track");
				const [stream] = event.streams;
				setRemoteStream(stream);
				if (remoteVideoRef.current) {
					remoteVideoRef.current.srcObject = stream;
				}
				setConnectionStatus("connected");
			};

			// ICE候補の処理
			peerConnection.onicecandidate = (event) => {
				if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
					console.log("[WebRTC] Sending ICE candidate");
					wsRef.current.send(
						JSON.stringify({
							type: "ice-candidate",
							candidate: event.candidate,
						}),
					);
				}
			};

			// 接続状態の監視
			peerConnection.onconnectionstatechange = () => {
				console.log(
					"[WebRTC] Connection state:",
					peerConnection.connectionState,
				);
				if (peerConnection.connectionState === "connected") {
					setConnectionStatus("connected");
				} else if (peerConnection.connectionState === "disconnected") {
					console.warn("[WebRTC] Connection disconnected");
					setConnectionStatus("disconnected");
				} else if (peerConnection.connectionState === "failed") {
					console.error("[WebRTC] Connection failed");
					setConnectionStatus("disconnected");
				} else if (peerConnection.connectionState === "closed") {
					console.log("[WebRTC] Connection closed");
					setConnectionStatus("disconnected");
				}
			};

			// ICE接続状態の監視
			peerConnection.oniceconnectionstatechange = () => {
				console.log(
					"[WebRTC] ICE connection state:",
					peerConnection.iceConnectionState,
				);
				if (peerConnection.iceConnectionState === "failed") {
					console.error("[WebRTC] ICE connection failed");
				} else if (peerConnection.iceConnectionState === "disconnected") {
					console.warn("[WebRTC] ICE connection disconnected");
				}
			};

			// ICE収集状態の監視
			peerConnection.onicegatheringstatechange = () => {
				console.log(
					"[WebRTC] ICE gathering state:",
					peerConnection.iceGatheringState,
				);
			};

			// WebSocketシグナリングサーバーに接続
			const wsUrl = `${SIGNALING_SERVER_URL.replace("http", "ws")}/ws/signal/${currentSessionId}?userId=${currentUserId}&role=${currentRole}`;
			console.log("[WebRTC] Connecting to signaling server:", wsUrl);
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("[WebRTC] WebSocket connected");
			};

			ws.onmessage = async (event) => {
				const message = JSON.parse(event.data);
				console.log("[WebRTC] Received message:", message.type);

				try {
					switch (message.type) {
						case "ready":
							// 既に相手がいる場合、partnerならofferを送信
							console.log(
								"[WebRTC] Room is ready, participants:",
								message.participantCount,
							);
							if (currentRole === "partner") {
								console.log("[WebRTC] Creating offer as partner...");
								const offer = await peerConnection.createOffer();
								await peerConnection.setLocalDescription(offer);
								ws.send(
									JSON.stringify({
										type: "offer",
										offer,
									}),
								);
								console.log("[WebRTC] Offer sent");
							}
							break;

						case "user-joined":
							// 相手が参加したらofferを送信（partnerの場合のみ）
							console.log("[WebRTC] User joined, role:", message.role);
							if (currentRole === "partner") {
								console.log("[WebRTC] Creating offer...");
								const offer = await peerConnection.createOffer();
								await peerConnection.setLocalDescription(offer);
								ws.send(
									JSON.stringify({
										type: "offer",
										offer,
									}),
								);
								console.log("[WebRTC] Offer sent");
							}
							break;

						case "offer": {
							// offerを受信したらanswerを返す
							console.log("[WebRTC] Received offer, creating answer...");
							await peerConnection.setRemoteDescription(
								new RTCSessionDescription(message.offer),
							);

							// バッファリングされたICE候補を追加
							console.log(
								"[WebRTC] Processing buffered ICE candidates:",
								iceCandidatesQueueRef.current.length,
							);
							for (const candidate of iceCandidatesQueueRef.current) {
								await peerConnection.addIceCandidate(candidate);
							}
							iceCandidatesQueueRef.current = [];

							const answer = await peerConnection.createAnswer();
							await peerConnection.setLocalDescription(answer);
							ws.send(
								JSON.stringify({
									type: "answer",
									answer,
								}),
							);
							console.log("[WebRTC] Answer sent");
							break;
						}

						case "answer":
							// answerを受信
							console.log("[WebRTC] Received answer");
							await peerConnection.setRemoteDescription(
								new RTCSessionDescription(message.answer),
							);

							// バッファリングされたICE候補を追加
							console.log(
								"[WebRTC] Processing buffered ICE candidates:",
								iceCandidatesQueueRef.current.length,
							);
							for (const candidate of iceCandidatesQueueRef.current) {
								await peerConnection.addIceCandidate(candidate);
							}
							iceCandidatesQueueRef.current = [];
							break;

						case "ice-candidate":
							// ICE候補を追加
							if (message.candidate) {
								console.log("[WebRTC] Received ICE candidate");
								const candidate = new RTCIceCandidate(message.candidate);

								// remoteDescriptionが設定されていない場合はバッファに追加
								if (!peerConnection.remoteDescription) {
									console.log(
										"[WebRTC] Buffering ICE candidate (no remote description yet)",
									);
									iceCandidatesQueueRef.current.push(candidate);
								} else {
									console.log("[WebRTC] Adding ICE candidate");
									await peerConnection.addIceCandidate(candidate);
								}
							}
							break;

						case "user-left":
							// 相手が退出
							console.log("[WebRTC] Remote user left");
							setConnectionStatus("disconnected");
							break;
					}
				} catch (error) {
					console.error("[WebRTC] Error handling message:", error);
				}
			};

			ws.onerror = (error) => {
				console.error("[WebRTC] WebSocket error:", error);
			};

			ws.onclose = () => {
				console.log("[WebRTC] WebSocket closed");
				setConnectionStatus("disconnected");
			};
		};

		initWebRTC();

		return () => {
			// クリーンアップ
			console.log("[WebRTC] Cleaning up WebRTC connection");
			if (wsRef.current) {
				wsRef.current.close();
			}
			if (peerConnectionRef.current) {
				peerConnectionRef.current.close();
			}
		};
	}, [localStream, userId, role, sessionId]);

	// 通話時間のカウント
	useEffect(() => {
		if (connectionStatus === "connected") {
			const interval = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [connectionStatus]);

	// ビデオのオン/オフ
	const toggleVideo = useCallback(() => {
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setIsVideoEnabled(videoTrack.enabled);
			}
		}
	}, [localStream]);

	// オーディオのオン/オフ
	const toggleAudio = useCallback(() => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				setIsAudioEnabled(audioTrack.enabled);
			}
		}
	}, [localStream]);

	// 通話終了
	const endCall = useCallback(async () => {
		if (localStream) {
			for (const track of localStream.getTracks()) {
				track.stop();
			}
		}
		if (wsRef.current) {
			wsRef.current.close();
		}
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
		}
		setConnectionStatus("disconnected");

		// フィードバックページへ遷移
		router.push(`/partner-feedback/${sessionId}`);
	}, [localStream, sessionId, router]);

	// 通話時間のフォーマット
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
			{/* Header */}
			<header className="p-4 bg-card/50 backdrop-blur-sm border-b border-border">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Heart className="w-6 h-6 text-primary fill-primary" />
						<div>
							<h1 className="font-semibold text-foreground">練習セッション</h1>
							<p className="text-sm text-muted-foreground">
								{connectionStatus === "connecting" && "接続中..."}
								{connectionStatus === "connected" &&
									formatDuration(callDuration)}
								{connectionStatus === "disconnected" && "通話終了"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<div
							className={`w-3 h-3 rounded-full ${
								connectionStatus === "connected"
									? "bg-green-500"
									: connectionStatus === "connecting"
										? "bg-yellow-500 animate-pulse"
										: "bg-red-500"
							}`}
						/>
						<span className="text-sm text-muted-foreground">
							{connectionStatus === "connecting" && "接続中"}
							{connectionStatus === "connected" && "接続済み"}
							{connectionStatus === "disconnected" && "切断"}
						</span>
					</div>
				</div>
			</header>

			{/* Video Area */}
			<main className="flex-1 p-4 flex flex-col gap-4">
				<div className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Remote Video (Partner/User) */}
					<Card className="relative overflow-hidden border-2 bg-black">
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							className="w-full h-full object-cover"
						/>
						{connectionStatus === "connecting" && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/80">
								<div className="text-center space-y-4">
									<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
									<p className="text-white text-lg">相手を待っています...</p>
								</div>
							</div>
						)}
						<div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
							<span className="text-white text-sm font-medium">
								{role === "partner" ? "ユーザー" : "パートナー"}
							</span>
						</div>
					</Card>

					{/* Local Video (You) */}
					<Card className="relative overflow-hidden border-2 bg-black">
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-full object-cover scale-x-[-1]"
						/>
						{!isVideoEnabled && (
							<div className="absolute inset-0 flex items-center justify-center bg-black">
								<div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
									<VideoOff className="w-12 h-12 text-white" />
								</div>
							</div>
						)}
						<div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
							<span className="text-white text-sm font-medium">あなた</span>
						</div>
						{!isAudioEnabled && (
							<div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm p-2 rounded-full">
								<MicOff className="w-5 h-5 text-white" />
							</div>
						)}
					</Card>
				</div>

				{/* Controls */}
				<div className="max-w-7xl w-full mx-auto">
					<Card className="p-6 border-2">
						<div className="flex items-center justify-center gap-4">
							{/* Toggle Video */}
							<Button
								onClick={toggleVideo}
								size="lg"
								variant={isVideoEnabled ? "default" : "destructive"}
								className="rounded-full w-14 h-14 p-0"
							>
								{isVideoEnabled ? (
									<Video className="w-6 h-6" />
								) : (
									<VideoOff className="w-6 h-6" />
								)}
							</Button>

							{/* Toggle Audio */}
							<Button
								onClick={toggleAudio}
								size="lg"
								variant={isAudioEnabled ? "default" : "destructive"}
								className="rounded-full w-14 h-14 p-0"
							>
								{isAudioEnabled ? (
									<Mic className="w-6 h-6" />
								) : (
									<MicOff className="w-6 h-6" />
								)}
							</Button>

							{/* End Call */}
							<Button
								onClick={endCall}
								size="lg"
								variant="destructive"
								className="rounded-full w-14 h-14 p-0"
							>
								<PhoneOff className="w-6 h-6" />
							</Button>
						</div>
					</Card>
				</div>
			</main>
		</div>
	);
}
