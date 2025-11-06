"use client";

import AgoraRTC, {
	type IAgoraRTCClient,
	type IAgoraRTCRemoteUser,
	type ICameraVideoTrack,
	type IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { Heart, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

// Agora App ID
const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";

export default function SessionRoomPageAgora() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const sessionId = params.sessionId as string;

	const localVideoRef = useRef<HTMLDivElement>(null);
	const remoteVideoRef = useRef<HTMLDivElement>(null);

	const [client, setClient] = useState<IAgoraRTCClient | null>(null);
	const [localVideoTrack, setLocalVideoTrack] =
		useState<ICameraVideoTrack | null>(null);
	const [localAudioTrack, setLocalAudioTrack] =
		useState<IMicrophoneAudioTrack | null>(null);

	// トラックのrefを保持（クリーンアップ用）
	const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
	const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);

	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");
	const [callDuration, setCallDuration] = useState(0);
	const [userRole, setUserRole] = useState<"user" | "partner" | null>(null);

	// URLパラメータからroleを取得
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const role = params.get("role") as "user" | "partner" | null;
			setUserRole(role || "user");
		} else {
			setUserRole("user");
		}
	}, []);

	// ダミーのuserIdを使用
	const userId =
		session?.user?.id || `user-${Math.random().toString(36).substring(7)}`;
	const role = userRole || "user";

	// Agoraクライアントの初期化
	useEffect(() => {
		if (!AGORA_APP_ID) {
			console.error("Agora App ID is not set");
			alert("Agora App IDが設定されていません");
			return;
		}

		const agoraClient = AgoraRTC.createClient({
			mode: "rtc",
			codec: "vp8",
		});

		setClient(agoraClient);

		return () => {
			agoraClient.leave();
		};
	}, []);

	// チャンネルに参加してトラックを公開
	useEffect(() => {
		if (!client) return;

		const init = async () => {
			try {
				// ローカルトラックを作成
				const [audioTrack, videoTrack] =
					await AgoraRTC.createMicrophoneAndCameraTracks();

				setLocalAudioTrack(audioTrack);
				setLocalVideoTrack(videoTrack);
				localAudioTrackRef.current = audioTrack;
				localVideoTrackRef.current = videoTrack;

				// ローカルビデオを表示
				if (localVideoRef.current) {
					videoTrack.play(localVideoRef.current);
				}

				// チャンネルに参加
				const uid = await client.join(
					AGORA_APP_ID,
					sessionId,
					null,
					userId,
				);

				console.log(`[Agora] Joined channel ${sessionId} with UID ${uid}`);

				// トラックを公開
				await client.publish([videoTrack, audioTrack]);
				console.log("[Agora] Published local tracks");

				setConnectionStatus("connected");
			} catch (error) {
				console.error("[Agora] Failed to initialize:", error);
				alert("通話の開始に失敗しました");
				setConnectionStatus("disconnected");
			}
		};

		init();

		// リモートユーザーの購読
		client.on("user-published", async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
			console.log(`[Agora] User ${user.uid} published ${mediaType}`);

			await client.subscribe(user, mediaType);
			console.log(`[Agora] Subscribed to ${mediaType} from ${user.uid}`);

			if (mediaType === "video" && remoteVideoRef.current) {
				user.videoTrack?.play(remoteVideoRef.current);
			}

			if (mediaType === "audio") {
				user.audioTrack?.play();
			}
		});

		client.on("user-unpublished", (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
			console.log(`[Agora] User ${user.uid} unpublished ${mediaType}`);
		});

		client.on("user-left", (user: IAgoraRTCRemoteUser) => {
			console.log(`[Agora] User ${user.uid} left`);
		});

		return () => {
			localVideoTrackRef.current?.close();
			localAudioTrackRef.current?.close();
			client.leave();
		};
	}, [client, sessionId, userId]);

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
		if (localVideoTrack) {
			const enabled = !isVideoEnabled;
			localVideoTrack.setEnabled(enabled);
			setIsVideoEnabled(enabled);
		}
	}, [localVideoTrack, isVideoEnabled]);

	// オーディオのオン/オフ
	const toggleAudio = useCallback(() => {
		if (localAudioTrack) {
			const enabled = !isAudioEnabled;
			localAudioTrack.setEnabled(enabled);
			setIsAudioEnabled(enabled);
		}
	}, [localAudioTrack, isAudioEnabled]);

	// 通話終了
	const endCall = useCallback(async () => {
		if (localVideoTrack) {
			localVideoTrack.close();
		}
		if (localAudioTrack) {
			localAudioTrack.close();
		}
		if (client) {
			await client.leave();
		}
		setConnectionStatus("disconnected");

		// フィードバックページへ遷移
		router.push(`/partner-feedback/${sessionId}`);
	}, [localVideoTrack, localAudioTrack, client, sessionId, router]);

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
							<h1 className="font-semibold text-foreground">
								練習セッション (Agora)
							</h1>
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
						<div
							ref={remoteVideoRef}
							className="w-full h-full"
							style={{ minHeight: "400px" }}
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
						<div
							ref={localVideoRef}
							className="w-full h-full"
							style={{ minHeight: "400px", transform: "scaleX(-1)" }}
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
