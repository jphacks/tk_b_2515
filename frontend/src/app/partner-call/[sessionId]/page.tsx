"use client";

import {
	Heart,
	MessageSquare,
	Mic,
	MicOff,
	PhoneOff,
	Video,
	VideoOff,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { config } from "@/lib/config";

export default function PartnerCallPage() {
	const params = useParams();
	const router = useRouter();
	const searchParams = useSearchParams();
	const sessionId = params.sessionId as string;

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);

	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [isAudioEnabled, setIsAudioEnabled] = useState(true);
	const [isRemoteAudioEnabled, setIsRemoteAudioEnabled] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "disconnected"
	>("connecting");
	const [callDuration, setCallDuration] = useState(0);
	const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5分 = 300秒
	const [partnerName, setPartnerName] = useState("パートナー");

	// 通話終了
	const endCall = useCallback(async () => {
		if (localStream) {
			for (const track of localStream.getTracks()) {
				track.stop();
			}
		}
		setConnectionStatus("disconnected");

		try {
			// セッション終了APIを呼び出す
			const endResponse = await fetch(
				`${config.api.baseUrl}/api/partners/sessions/${sessionId}/end`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (endResponse.ok) {
				console.log("Session ended successfully");
			} else {
				console.error("Failed to end session");
			}

			// フィードバック生成APIを呼び出す
			const feedbackResponse = await fetch(
				`${config.api.baseUrl}/api/partners/sessions/${sessionId}/feedback/generate`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						messages: [],
						gestureMetrics: undefined,
					}),
				},
			);

			if (feedbackResponse.ok) {
				console.log("Feedback generated successfully");
			} else {
				console.error("Failed to generate feedback");
			}
		} catch (error) {
			console.error("Error ending call:", error);
		}

		// フィードバックページへ遷移
		router.push(`/partner-feedback/${sessionId}`);
	}, [localStream, sessionId, router]);

	// TODO: 実際のセッション情報をAPIから取得
	useEffect(() => {
		let isMounted = true;

		const resolvePartnerName = async () => {
			try {
				const partnerNameFromQuery = searchParams.get("partnerName");
				if (isMounted && partnerNameFromQuery) {
					setPartnerName(partnerNameFromQuery);
					return;
				}

				// TODO: Fetch session details via API when available
				if (isMounted) {
					setPartnerName((current) => current);
				}
			} catch (error) {
				console.error("Failed to resolve partner name:", error);
			}
		};

		void resolvePartnerName();

		return () => {
			isMounted = false;
		};
	}, [searchParams]);

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
				setConnectionStatus("connected");
			} catch (error) {
				console.error("Error accessing media devices:", error);
				alert("カメラまたはマイクへのアクセスに失敗しました");
			}
		};

		void initMedia();

		return () => {
			isMounted = false;
			if (activeStream) {
				for (const track of activeStream.getTracks()) {
					track.stop();
				}
			}
		};
	}, []);

	// 通話時間のカウントと残り時間のカウントダウン
	useEffect(() => {
		if (connectionStatus === "connected") {
			const interval = setInterval(() => {
				setCallDuration((prev) => prev + 1);
				setTimeRemaining((prev) => {
					const next = prev - 1;
					if (next <= 0) {
						return 0;
					}
					return next;
				});
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [connectionStatus]);

	// 時間切れで自動的にフィードバックページへ遷移
	useEffect(() => {
		if (timeRemaining === 0 && connectionStatus === "connected") {
			console.log("Time is up! Ending call and redirecting to feedback...");
			endCall();
		}
	}, [timeRemaining, connectionStatus, endCall]);

	// ビデオのオン/オフ
	const toggleVideo = useCallback(() => {
		if (localStream) {
			const [videoTrack] = localStream.getVideoTracks();
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setIsVideoEnabled(videoTrack.enabled);
			}
		}
	}, [localStream]);

	// オーディオのオン/オフ
	const toggleAudio = useCallback(() => {
		if (localStream) {
			const [audioTrack] = localStream.getAudioTracks();
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				setIsAudioEnabled(audioTrack.enabled);
			}
		}
	}, [localStream]);

	// リモートオーディオのミュート
	const toggleRemoteAudio = useCallback(() => {
		if (remoteVideoRef.current) {
			remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
			setIsRemoteAudioEnabled(!remoteVideoRef.current.muted);
		}
	}, []);

	// 通話時間のフォーマット
	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	// 残り時間のフォーマット
	const formatTimeRemaining = (seconds: number) => {
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
							<h1 className="font-semibold text-foreground">{partnerName}</h1>
							<p className="text-sm text-muted-foreground">
								{connectionStatus === "connecting" && "接続中..."}
								{connectionStatus === "connected" &&
									formatDuration(callDuration)}
								{connectionStatus === "disconnected" && "通話終了"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-4">
						{/* 残り時間表示 */}
						{connectionStatus === "connected" && (
							<div className="flex items-center gap-2">
								<span className="text-sm text-muted-foreground">残り時間:</span>
								<span
									className={`text-lg font-bold ${
										timeRemaining <= 60
											? "text-red-500 animate-pulse"
											: "text-foreground"
									}`}
								>
									{formatTimeRemaining(timeRemaining)}
								</span>
							</div>
						)}
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
				</div>
			</header>

			{/* Video Area */}
			<main className="flex-1 p-4 flex flex-col gap-4">
				<div className="max-w-7xl w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
					{/* Remote Video (Partner) */}
					<Card className="relative overflow-hidden border-2 bg-black">
						<video
							ref={remoteVideoRef}
							autoPlay
							playsInline
							aria-label="パートナーのビデオフィード"
							className="w-full h-full object-cover"
						>
							<track
								kind="captions"
								label="ライブ配信につき字幕は現在利用できません"
								src="data:text/vtt,WEBVTT\n"
								default
							/>
						</video>
						{connectionStatus === "connecting" && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/80">
								<div className="text-center space-y-4">
									<div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
									<p className="text-white text-lg">
										パートナーを待っています...
									</p>
								</div>
							</div>
						)}
						<div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
							<span className="text-white text-sm font-medium">
								{partnerName}
							</span>
						</div>
						{!isRemoteAudioEnabled && (
							<div className="absolute top-4 right-4 bg-red-500/80 backdrop-blur-sm p-2 rounded-full">
								<VolumeX className="w-5 h-5 text-white" />
							</div>
						)}
					</Card>

					{/* Local Video (You) */}
					<Card className="relative overflow-hidden border-2 bg-black">
						<video
							ref={localVideoRef}
							autoPlay
							playsInline
							muted
							aria-label="あなたのビデオフィード"
							className="w-full h-full object-cover scale-x-[-1]"
						>
							<track
								kind="captions"
								label="ライブ配信につき字幕は現在利用できません"
								src="data:text/vtt,WEBVTT\n"
								default
							/>
						</video>
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

							{/* Toggle Remote Audio */}
							<Button
								onClick={toggleRemoteAudio}
								size="lg"
								variant={isRemoteAudioEnabled ? "default" : "destructive"}
								className="rounded-full w-14 h-14 p-0"
							>
								{isRemoteAudioEnabled ? (
									<Volume2 className="w-6 h-6" />
								) : (
									<VolumeX className="w-6 h-6" />
								)}
							</Button>
						</div>
					</Card>
				</div>
			</main>

			{/* AI Coaching Tips (Optional) */}
			<div className="fixed bottom-24 right-4 max-w-sm">
				<Card className="p-4 border-2 border-primary/20 bg-card/95 backdrop-blur-sm">
					<div className="flex items-start gap-3">
						<MessageSquare className="w-5 h-5 text-primary mt-1" />
						<div className="space-y-1">
							<p className="text-sm font-semibold text-foreground">
								AIコーチングのヒント
							</p>
							<p className="text-xs text-muted-foreground">
								相手の目を見て話しましょう。笑顔を忘れずに！
							</p>
						</div>
					</div>
				</Card>
			</div>
		</div>
	);
}
