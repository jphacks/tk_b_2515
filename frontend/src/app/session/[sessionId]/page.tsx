/**
 * WebRTCビデオ通話セッションページ (Agora版)
 *
 * 1対1のビデオ通話機能を提供します。
 * Agora RTC SDKを使用して、安定したWebRTC接続を実現します。
 *
 * 主な機能：
 * - カメラとマイクへのアクセス
 * - Agora経由のWebRTC接続
 * - ビデオ・オーディオのオン/オフ切り替え
 * - 通話時間のカウント
 * - 通話終了後のホームへ遷移
 */
"use client";

import { Heart, Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAgoraCall } from "@/hooks/useAgoraCall";
import { useSession } from "@/lib/auth-client";
import { config } from "@/lib/config";

const API_URL = config.api.baseUrl;

export default function SessionRoomPage() {
	const params = useParams();
	const router = useRouter();
	const { data: session } = useSession();
	const sessionId = params.sessionId as string;

	const localVideoRef = useRef<HTMLDivElement>(null);
	const remoteVideoRef = useRef<HTMLDivElement>(null);

	const [callDuration, setCallDuration] = useState(0);
	const [userRole, setUserRole] = useState<"user" | "partner" | null>(null);
	const [userId, setUserId] = useState<string>("");
	const [agoraOptions, setAgoraOptions] = useState<{
		appId: string;
		channelName: string;
		token: string;
		uid: number;
	} | null>(null);
	const LIMIT_SECONDS = 180;
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

	// URLパラメータからroleを取得し、userIdを初期化
	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const role = params.get("role") as "user" | "partner" | null;
			setUserRole(role || "user");
		} else {
			setUserRole("user");
		}

		// userIdを一度だけ生成
		if (!userId) {
			const id =
				session?.user?.id ||
				`user-${Math.random().toString(36).substring(7)}`;
			setUserId(id);
			console.log("[Session] Generated userId:", id);
		}
	}, [session?.user?.id, userId]);

	const role = userRole || "user";

	// Agoraトークン取得
	useEffect(() => {
		if (!userId || !role) {
			console.log("[Session] Waiting for userId and role...");
			return;
		}

		const fetchToken = async () => {
			try {
				console.log("[Session] Fetching Agora token...");
				const response = await fetch(`${API_URL}/api/agora/token`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						channelName: sessionId,
						userId,
						role,
					}),
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch token: ${response.statusText}`);
				}

				const data = await response.json();
				console.log("[Session] Agora token received");

				setAgoraOptions({
					appId: data.appId,
					channelName: data.channelName,
					token: data.token,
					uid: data.uid,
				});
			} catch (error) {
				console.error("[Session] Token fetch error:", error);
				alert("通話の準備に失敗しました");
			}
		};

		fetchToken();
	}, [userId, role, sessionId]);

	// Agora通話フック
	const {
		localVideoTrack,
		remoteVideoTrack,
		connectionState,
		isVideoEnabled,
		isAudioEnabled,
		toggleVideo,
		toggleAudio,
		leave,
	} = useAgoraCall(agoraOptions);

	// ローカルビデオを表示
	useEffect(() => {
		if (localVideoTrack && localVideoRef.current) {
			localVideoTrack.play(localVideoRef.current);
			console.log("[Session] Local video playing");
		}
	}, [localVideoTrack]);

	// リモートビデオを表示
	useEffect(() => {
		if (remoteVideoTrack && remoteVideoRef.current) {
			remoteVideoTrack.play(remoteVideoRef.current);
			console.log("[Session] Remote video playing");
		}
	}, [remoteVideoTrack]);

	// 通話終了
	const endCall = useCallback(async () => {
		await leave();
		try {
			localStorage.setItem(`webrtc_end_${sessionId}`, String(Date.now()));
		} catch {
			/* ignore */
		}
		router.push("/");
	}, [leave, router, sessionId]);

	// 通話時間のカウントと残り時間
	useEffect(() => {
		if (connectionState !== "connected") {
			setTimeRemaining(null);
			return;
		}

		const durationInterval = setInterval(() => {
			setCallDuration((prev) => prev + 1);
		}, 1000);

		setTimeRemaining((prev) => prev ?? LIMIT_SECONDS);

		const remainingInterval = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev === null) return prev;
				return prev > 0 ? prev - 1 : 0;
			});
		}, 1000);

		return () => {
			clearInterval(durationInterval);
			clearInterval(remainingInterval);
		};
	}, [connectionState]);

	// 制限時間に到達したら自動終了
	useEffect(() => {
		if (timeRemaining === 0) {
			void endCall();
		}
	}, [timeRemaining, endCall]);

	// 接続状態をlocalStorageに反映(test-call連携用)
	useEffect(() => {
		if (!sessionId || !role) return;
		try {
			const key = `webrtc_connected_${sessionId}_${role}`;
			if (connectionState === "connected") {
				localStorage.setItem(key, "true");
			} else if (connectionState === "disconnected") {
				localStorage.removeItem(key);
			}
		} catch {
			/* ignore */
		}
	}, [connectionState, sessionId, role]);

	// test-callページからの終了通知を監視
	useEffect(() => {
		if (!sessionId) return;
		const key = `webrtc_end_${sessionId}`;
		const onStorage = (e: StorageEvent) => {
			if (e.key === key) {
				if (connectionState !== "disconnected") {
					void endCall();
				}
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, [sessionId, connectionState, endCall]);

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
								{connectionState === "connecting" && "接続中..."}
								{connectionState === "connected" && formatDuration(callDuration)}
								{connectionState === "disconnected" && "通話終了"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{connectionState === "connected" && timeRemaining !== null && (
							<div className="text-sm font-semibold text-foreground bg-primary/10 px-3 py-1 rounded-full">
								残り {formatDuration(timeRemaining)}
							</div>
						)}
						<div className="flex items-center gap-2">
							<div
								className={`w-3 h-3 rounded-full ${
									connectionState === "connected"
										? "bg-green-500"
										: connectionState === "connecting"
											? "bg-yellow-500 animate-pulse"
											: "bg-red-500"
								}`}
							/>
							<span className="text-sm text-muted-foreground">
								{connectionState === "connecting" && "接続中"}
								{connectionState === "connected" && "接続済み"}
								{connectionState === "disconnected" && "切断"}
							</span>
						</div>
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
						{connectionState === "connecting" && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/80">
								<div className="text-center space-y-4">
									<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
									<p className="text-white text-lg">相手を待っています...</p>
								</div>
							</div>
						)}
						{connectionState === "connected" && !remoteVideoTrack && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/80">
								<div className="text-center space-y-4">
									<VideoOff className="w-16 h-16 text-white mx-auto" />
									<p className="text-white text-lg">
										相手のビデオがオフになっています
									</p>
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
							style={{
								minHeight: "400px",
								transform: "scaleX(-1)",
							}}
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
