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

	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");
	const [callDuration, setCallDuration] = useState(0);
	const [userRole, setUserRole] = useState<"user" | "partner" | null>(null);

	// セッション情報からroleを取得
	useEffect(() => {
		// デフォルトでuserロールを設定
		setUserRole("user");
	}, []);

	// ダミーのuserIdを使用
	const userId = session?.user?.id || `user-${Math.random().toString(36).substring(7)}`;
	const role = userRole || "user";

	// カメラとマイクの初期化
	useEffect(() => {
		let isMounted = true;
		let activeStream: MediaStream | null = null;

		const initMedia = async () => {
			try {
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

				activeStream = stream;
				setLocalStream(stream);
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
			} catch (error) {
				console.error("Error accessing media devices:", error);
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
		if (!localStream) return;

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

			// リモートストリームの受信
			peerConnection.ontrack = (event) => {
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
				console.log("Connection state:", peerConnection.connectionState);
				if (peerConnection.connectionState === "connected") {
					setConnectionStatus("connected");
				} else if (
					peerConnection.connectionState === "disconnected" ||
					peerConnection.connectionState === "failed"
				) {
					setConnectionStatus("disconnected");
				}
			};

			// WebSocketシグナリングサーバーに接続
			const wsUrl = `${SIGNALING_SERVER_URL.replace("http", "ws")}/ws/signal/${sessionId}?userId=${userId}&role=${role}`;
			const ws = new WebSocket(wsUrl);
			wsRef.current = ws;

			ws.onopen = () => {
				console.log("WebSocket connected");
			};

			ws.onmessage = async (event) => {
				const message = JSON.parse(event.data);

				switch (message.type) {
					case "user-joined":
						// 相手が参加したらofferを送信（partnerの場合のみ）
						if (role === "partner") {
							const offer = await peerConnection.createOffer();
							await peerConnection.setLocalDescription(offer);
							ws.send(
								JSON.stringify({
									type: "offer",
									offer,
								}),
							);
						}
						break;

					case "offer": {
						// offerを受信したらanswerを返す
						await peerConnection.setRemoteDescription(
							new RTCSessionDescription(message.offer),
						);
						const answer = await peerConnection.createAnswer();
						await peerConnection.setLocalDescription(answer);
						ws.send(
							JSON.stringify({
								type: "answer",
								answer,
							}),
						);
						break;
					}

					case "answer":
						// answerを受信
						await peerConnection.setRemoteDescription(
							new RTCSessionDescription(message.answer),
						);
						break;

					case "ice-candidate":
						// ICE候補を追加
						if (message.candidate) {
							await peerConnection.addIceCandidate(
								new RTCIceCandidate(message.candidate),
							);
						}
						break;

					case "user-left":
						// 相手が退出
						setConnectionStatus("disconnected");
						break;
				}
			};

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
			};

			ws.onclose = () => {
				console.log("WebSocket closed");
				setConnectionStatus("disconnected");
			};
		};

		initWebRTC();

		return () => {
			// クリーンアップ
			if (wsRef.current) {
				wsRef.current.close();
			}
			if (peerConnectionRef.current) {
				peerConnectionRef.current.close();
			}
		};
	}, [localStream, sessionId, userId, role]);

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
