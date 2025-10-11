"use client";

import { ArrowLeft, Heart, Mic, MicOff, Phone, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { VideoStream } from "@/components/VideoStream";

export default function SimulationPage() {
	const [conversationStarted, setConversationStarted] = useState(false);
	const [videoEnabled, setVideoEnabled] = useState(true);

	// メディアデバイス（カメラ・マイク）へのアクセス
	const { stream, error: mediaError, startStream, stopStream } = useMediaDevices();

	// 音声録音機能
	const {
		isRecording,
		isPaused,
		audioURL,
		error: recorderError,
		startRecording,
		stopRecording,
		pauseRecording,
		resumeRecording,
	} = useAudioRecorder();

	const handleStartConversation = async () => {
		// カメラとマイクへのアクセスを開始
		await startStream({ video: true, audio: true });
		setConversationStarted(true);
	};

	const handleEndConversation = () => {
		// 録音を停止
		if (isRecording) {
			stopRecording();
		}
		// メディアストリームを停止
		stopStream();
		// Navigate to feedback page
		window.location.href = "/feedback";
	};

	const toggleRecording = () => {
		if (!stream) return;

		if (!isRecording) {
			// 録音を開始
			startRecording(stream);
		} else if (isPaused) {
			// 録音を再開
			resumeRecording();
		} else {
			// 録音を一時停止
			pauseRecording();
		}
	};

	const toggleVideo = () => {
		if (stream) {
			const videoTrack = stream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setVideoEnabled(videoTrack.enabled);
			}
		}
	};

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
			{/* Header */}
			<header className="p-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
				<Link href="/">
					<Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10">
						<ArrowLeft className="w-4 h-4 mr-2" />
						ホームへ
					</Button>
				</Link>
				<div className="flex items-center gap-2">
					<Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
					<span className="font-bold text-foreground text-lg">恋ai</span>
				</div>
				<div className="w-24" /> {/* Spacer for alignment */}
			</header>

			{!conversationStarted ? (
				/* Initial State - Full Screen Welcome */
				<main className="flex-1 flex items-center justify-center p-6">
					<div className="max-w-xl w-full space-y-8 animate-fade-in">
						<div className="text-center space-y-4">
							<div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
								<Heart className="w-20 h-20 text-primary animate-pulse" />
							</div>
							<h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
								会話シミュレーション
							</h1>
							<p className="text-muted-foreground text-xl">
								AIと会話の練習をしましょう
							</p>
						</div>

						<Card className="p-10 text-center border-2 border-primary/20 shadow-xl space-y-8 bg-card/50 backdrop-blur-sm">
							<div className="space-y-4">
								<h2 className="text-3xl font-bold text-foreground">
									準備はできましたか？
								</h2>
								<p className="text-muted-foreground text-lg">
									カメラとマイクへのアクセスを許可して<br />
									会話を始めましょう
								</p>
							</div>
							<Button
								size="lg"
								className="rounded-full px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
								onClick={handleStartConversation}
							>
								<Video className="w-6 h-6 mr-2" />
								会話を始める
							</Button>
						</Card>
					</div>
				</main>
			) : (
				/* Conversation State - Video-centric Layout */
				<main className="flex-1 flex flex-col overflow-hidden">
					{/* Video Container - Takes most of the screen */}
					<div className="flex-1 relative bg-black/90">
						{stream && videoEnabled ? (
							<VideoStream
								stream={stream}
								className="w-full h-full object-contain"
							/>
						) : (
							<div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
								<VideoOff className="w-24 h-24 text-muted-foreground/50 mb-4" />
								<p className="text-muted-foreground text-lg">カメラがオフになっています</p>
							</div>
						)}

						{/* Recording Status Indicator - Floating Top Right */}
						<div className="absolute top-6 right-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
							<div
								className={`w-4 h-4 rounded-full ${
									isRecording && !isPaused
										? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
										: "bg-gray-500"
								}`}
							/>
							<span className="text-white font-semibold text-sm">
								{!isRecording
									? "待機中"
									: isPaused
										? "一時停止"
										: "録音中"}
							</span>
						</div>

						{/* Error Messages - Floating Top Center */}
						{(mediaError || recorderError) && (
							<div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-md">
								<div className="bg-destructive/90 backdrop-blur-md text-destructive-foreground px-6 py-3 rounded-lg shadow-lg border border-destructive">
									<p className="text-sm font-medium text-center">
										⚠️ {mediaError?.message || recorderError?.message}
									</p>
								</div>
							</div>
						)}
					</div>

					{/* Control Panel - Bottom Fixed */}
					<div className="bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl">
						<div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
							{/* Status Text */}
							<div className="text-center">
								<p className="text-sm text-muted-foreground">
									{!isRecording
										? "マイクボタンを押して録音を開始してください"
										: isPaused
											? "録音が一時停止されています"
											: "話している内容が記録されています"}
								</p>
							</div>

							{/* Audio Playback */}
							{audioURL && (
								<div className="flex justify-center pb-2">
									<div className="w-full max-w-md bg-background/50 p-3 rounded-lg border border-border/50">
										<audio controls src={audioURL} className="w-full">
											<track kind="captions" />
										</audio>
									</div>
								</div>
							)}

							{/* Main Controls */}
							<div className="flex gap-4 justify-center items-center flex-wrap">
								{/* Recording Button - Primary */}
								<Button
									size="lg"
									variant={isRecording && !isPaused ? "secondary" : "default"}
									className="rounded-full h-16 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
									onClick={toggleRecording}
									disabled={!stream}
								>
									{!isRecording ? (
										<>
											<Mic className="w-6 h-6 mr-2" />
											録音開始
										</>
									) : isPaused ? (
										<>
											<Mic className="w-6 h-6 mr-2" />
											録音再開
										</>
									) : (
										<>
											<MicOff className="w-6 h-6 mr-2" />
											一時停止
										</>
									)}
								</Button>

								{/* Video Toggle */}
								<Button
									size="lg"
									variant="outline"
									className="rounded-full h-16 px-6 hover:scale-105 transition-all"
									onClick={toggleVideo}
									disabled={!stream}
								>
									{videoEnabled ? (
										<VideoOff className="w-5 h-5" />
									) : (
										<Video className="w-5 h-5" />
									)}
								</Button>

								{/* End Call Button */}
								<Button
									size="lg"
									variant="destructive"
									className="rounded-full h-16 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
									onClick={handleEndConversation}
								>
									<Phone className="w-6 h-6 mr-2 rotate-[135deg]" />
									通話終了
								</Button>
							</div>
						</div>
					</div>
				</main>
			)}
		</div>
	);
}
