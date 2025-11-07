"use client";

import { Heart, Video } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	AvatarDisplay,
	ConversationControls,
	ConversationHistoryPanel,
	ErrorDisplay,
	RecordingStatus,
	UserVideoDisplay,
} from "@/components/simulation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { VideoStreamRef } from "@/components/VideoStream";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useConversation } from "@/hooks/useConversation";
import { useFacialAnalysis } from "@/hooks/useFacialAnalysis";
import { useGestureTracking } from "@/hooks/useGestureTracking";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useSimulationTimer } from "@/hooks/useSimulationTimer";
import { BACKGROUND_ADVICE } from "@/lib/advice";
import { AdviceChecklist } from "@/components/simulation/AdviceChecklist";
import { preloadVRM } from "@/hooks/useVRM";
import { gestureApi } from "@/lib/api";
import { appendVoiceAnalysis } from "@/lib/audio/voiceAnalysisStorage";
import { config } from "@/lib/config";
import { logMediaRecorderSupport } from "@/lib/mediaRecorderSupport";
import { romajiToHiragana } from "@/lib/romajiToHiragana";

type GestureType = "idle" | "thinking" | "talking" | "explaining" | "nodding";

type BackgroundKey = "library" | "classroom" | "xmas";

const BACKGROUNDS: Record<
	BackgroundKey,
	{ src: string; label: string; scenario: string }
> = {
	library: {
		src: "/uec_library.jpg",
		label: "図書館",
		scenario:
			"静かな図書館。声は控えめに、落ち着いたトーンで趣味や勉強の話から始めると自然です。",
	},
	classroom: {
		src: "/kokuban.png",
		label: "教室",
		scenario:
			"放課後の教室。授業や課題、サークル、週末の予定など身近な話題が話しやすい雰囲気です。",
	},
	xmas: {
		src: "/xmas.png",
		label: "クリスマス",
		scenario:
			"イルミネーションの前。最近の出来事やプレゼント、冬の予定など明るい話題で盛り上がりやすいです。",
	},
};

export default function SimulationPage() {
	const [conversationStarted, setConversationStarted] = useState(false);
	const [videoEnabled, setVideoEnabled] = useState(true);
	const [lipSyncValue, setLipSyncValue] = useState(0);
	const [showHistory, setShowHistory] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [avatarEmotion, setAvatarEmotion] = useState<
		"neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful"
	>("happy");
	const [avatarGesture, setAvatarGesture] = useState<GestureType>("idle");
	const [selectedAvatar, setSelectedAvatar] = useState<
		"female" | "male" | "neutral"
	>("female");
	const [selectedBackground, setSelectedBackground] =
		useState<BackgroundKey>("library");
	const [assistMode, setAssistMode] = useState<boolean>(true);
	const [adviceCompleted, setAdviceCompleted] = useState<Record<string, boolean>>({});

	const videoStreamRef = useRef<VideoStreamRef>(null);
	const hasSentBatchRef = useRef(false);
	const avatarModelUrl = useMemo(() => {
		if (selectedAvatar === "male") return "/models/rento.vrm";
		if (selectedAvatar === "neutral") return "/models/kouta.vrm";
		return "/models/maki.vrm"; // female
	}, [selectedAvatar]);

	// 背景の保存/復元
	useEffect(() => {
		try {
			const saved = localStorage.getItem(
				"selectedBackground",
			) as BackgroundKey | null;
			if (saved === "library" || saved === "classroom" || saved === "xmas") {
				setSelectedBackground(saved);
			}
			const savedAssist = localStorage.getItem("assistMode");
			if (savedAssist === "true" || savedAssist === "false") {
				setAssistMode(savedAssist === "true");
			}
		} catch {
			// ignore
		}
	}, []);
	useEffect(() => {
		try {
			localStorage.setItem("selectedBackground", selectedBackground);
			localStorage.setItem("assistMode", String(assistMode));
		} catch {
			// ignore
		}
	}, [selectedBackground, assistMode]);
	const avatarName = useMemo(() => {
		const parts = avatarModelUrl.split("/");
		const file = parts[parts.length - 1] || "";
		const base = file.replace(/\.vrm$/i, "");
		return romajiToHiragana(base) || base;
	}, [avatarModelUrl]);
	const selectedVoiceId = useMemo(() => {
		const femaleId = config.tts.voices?.female || config.tts.voiceId || "";
		const maleId = config.tts.voices?.male || "";
		const neutralId = config.tts.voices?.neutral || femaleId;
		if (selectedAvatar === "male") return maleId || config.tts.voiceId || "";
		if (selectedAvatar === "neutral")
			return neutralId || config.tts.voiceId || "";
		return femaleId;
	}, [selectedAvatar]);

	// auth handled by shared Header; no local auth state here

	// Persist selected avatar for use on feedback page (e.g., to choose voice)
	useEffect(() => {
		try {
			localStorage.setItem("selectedAvatar", selectedAvatar);
		} catch {
			// ignore
		}
	}, [selectedAvatar]);

	// Media devices (camera/mic)
	const {
		stream,
		error: mediaError,
		startStream,
		stopStream,
	} = useMediaDevices();

	// Audio recording
	const {
		isRecording,
		audioURL,
		audioBlobs,
		analysisResult,
		error: recorderError,
		startRecording,
		stopRecording,
		clearRecording,
	} = useAudioRecorder();

	// Facial analysis
	const {
		metrics: facialMetrics,
		error: facialError,
		startAnalysis,
		stopAnalysis,
	} = useFacialAnalysis();

	// Gesture tracking
	const { reset: resetGestures, getMetrics: getGestureMetrics } =
		useGestureTracking(facialMetrics);

	// Lip sync update callback
	const handleLipSyncUpdate = useCallback((value: number) => {
		setLipSyncValue(value);
	}, []);

	// Conversation management
	const {
		session,
		messages,
		isProcessing,
		error: conversationError,
		startSession,
		endSession,
		sendAudio,
	} = useConversation({
		onLipSyncUpdate: handleLipSyncUpdate,
		ttsVoiceId: selectedVoiceId || undefined,
		onEmotionUpdate: setAvatarEmotion,
		avatarId: selectedAvatar === "female" ? "maki" : selectedAvatar === "male" ? "rento" : "kouta",
	});
	// 最新ユーザー発話でアドバイス達成判定（state反映遅延による未達表示不安定性を解消）
	useEffect(() => {
		if (!messages.length) return;
		const lastUser = [...messages].reverse().find(m => m.role === 'user');
		if (!lastUser) return;
		const text = lastUser.content;
		const adviceList = BACKGROUND_ADVICE[selectedBackground];
		let next = { ...adviceCompleted };
		let changed = false;
		for (const item of adviceList) {
			if (next[item.id]) continue;
			if (item.patterns.some(re => re.test(text))) {
				next[item.id] = true;
				changed = true;
			}
		}
		if (changed) {
			setAdviceCompleted(next);
			try {
				if (session?.id) {
					localStorage.setItem(`adviceCompleted:${session.id}`, JSON.stringify(next));
				}
			} catch {}
		}
	}, [messages, selectedBackground, adviceCompleted, session?.id]);

	// セッション開始時に過去の達成状況があれば復元
	useEffect(() => {
		if (!session?.id) return;
		try {
			const raw = localStorage.getItem(`adviceCompleted:${session.id}`);
			if (raw) {
				const parsed = JSON.parse(raw) as Record<string, boolean>;
				setAdviceCompleted(parsed);
			}
		} catch {}
	}, [session?.id]);

	// 背景変更時にアドバイス進捗リセット
	// biome-ignore lint/correctness/useExhaustiveDependencies: 背景変更トリガでのみリセットしたい
	useEffect(() => {
		setAdviceCompleted({});
		void selectedBackground; // 明示的に依存を使用
	}, [selectedBackground]);

	// Timer management
	const { timeRemaining, startTimer, stopTimer } = useSimulationTimer({
		conversationStarted,
		onTimeout: handleEndConversation,
	});

	// Preload VRM model when selected avatar changes
	useEffect(() => {
		logMediaRecorderSupport();
		preloadVRM(avatarModelUrl).catch(() => {
			// Non-critical, ignore
		});
		// フィードバック画面でも使えるようにモデルURLを永続化
		try {
			localStorage.setItem("selectedAvatarModelUrl", avatarModelUrl);
		} catch {
			// ignore
		}
	}, [avatarModelUrl]);

	// Video ready handler
	const handleVideoReady = useCallback(
		(videoElement: HTMLVideoElement) => {
			console.log("ビデオ準備完了、表情分析を開始します");
			startAnalysis(videoElement, { x: 0.25, y: 0.5 });
		},
		[startAnalysis],
	);

	// End conversation handler
	async function handleEndConversation() {
		stopTimer();

		if (isRecording) {
			stopRecording();
		}

		stopAnalysis();

		// Save gesture metrics
		if (session?.id) {
			const gestureMetrics = getGestureMetrics();
			if (gestureMetrics) {
				try {
					await gestureApi.saveMetrics(session.id, gestureMetrics);
				} catch (error) {
					console.error("Failed to save gesture metrics:", error);
				}
			}
		}

		await endSession();
		stopStream();

		// Redirect to feedback page
		if (session?.id) {
			window.location.href = `/feedback?sessionId=${session.id}`;
		} else {
			window.location.href = "/feedback";
		}
	}

	// Start conversation handler
	const handleStartConversation = useCallback(async () => {
		try {
			resetGestures();

			await startStream({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					frameRate: { ideal: 24 },
					facingMode: "user",
				},
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			await startSession();
			setConversationStarted(true);
			startTimer(3 * 60); // 3 minutes
		} catch (error) {
			console.error("Failed to start conversation:", error);
		}
	}, [startStream, startSession, startTimer, resetGestures]);

	// Toggle recording
	const toggleRecording = useCallback(() => {
		if (!stream) return;

		if (!isRecording) {
			startRecording(stream);
		} else {
			stopRecording();
		}
	}, [stream, isRecording, startRecording, stopRecording]);

	// Send recorded audio when recording stops
	useEffect(() => {
		if (
			audioBlobs.length === 0 ||
			isRecording ||
			!session ||
			!analysisResult ||
			hasSentBatchRef.current
		)
			return;

		const sendRecordedAudio = async () => {
			hasSentBatchRef.current = true; // guard duplicate sends for this batch
			console.log("Sending recorded audio...");
			const audioBlob = new Blob(audioBlobs, {
				type: audioBlobs[0]?.type || "audio/webm",
			});
			appendVoiceAnalysis(session.id, analysisResult);
			await sendAudio(audioBlob, analysisResult);
			clearRecording();
			// reset guard for next recording batch after clearing
			setTimeout(() => {
				hasSentBatchRef.current = false;
			}, 0);
		};

		sendRecordedAudio();
	}, [
		audioBlobs,
		isRecording,
		session,
		sendAudio,
		clearRecording,
		analysisResult,
	]);

	// When a new recording starts, ensure guard is cleared
	useEffect(() => {
		if (isRecording) {
			hasSentBatchRef.current = false;
		}
	}, [isRecording]);

	// 会話内容に基づくemotion更新は useConversation の onEmotionUpdate から反映

	// Gesture changes based on recording/processing state
	useEffect(() => {
		if (isRecording) {
			setAvatarGesture("nodding");
		} else if (isProcessing) {
			setAvatarGesture("thinking");
		} else if (lipSyncValue > 0.1) {
			setAvatarGesture("talking");
		} else {
			const gestures: GestureType[] = ["idle", "idle", "idle", "explaining"];
			const randomGesture =
				gestures[Math.floor(Math.random() * gestures.length)];
			setAvatarGesture(randomGesture);
		}
	}, [isRecording, isProcessing, lipSyncValue]);

	// Toggle video
	const toggleVideo = useCallback(() => {
		if (stream) {
			const videoTrack = stream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setVideoEnabled(videoTrack.enabled);
			}
		}
	}, [stream]);

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
			{/* Header is provided by shared Header component in layout */}

			{!conversationStarted ? (
				/* Initial State - Full Screen Welcome */
				<main className="flex-1 flex items-center justify-center p-4 sm:p-6">
					<div className="max-w-xl w-full space-y-6 sm:space-y-8 animate-fade-in">
						<div className="text-center space-y-3 sm:space-y-4">
							<div className="inline-block p-3 sm:p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-3 sm:mb-4">
								<Heart className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-primary animate-pulse" />
							</div>
							<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-2">
								会話シミュレーション
							</h1>
							<p className="text-muted-foreground text-base sm:text-lg md:text-xl">
								{avatarName}と会話の練習をしましょう
							</p>
						</div>

						{(mediaError || conversationError) && (
							<Card className="p-6 border-2 border-destructive bg-destructive/5 space-y-3">
								<p className="text-sm font-bold text-destructive text-center flex items-center justify-center gap-2">
									<span className="text-lg">⚠️</span>
									エラーが発生しました
								</p>
								<p className="text-sm text-center text-foreground">
									{mediaError?.message || conversationError?.message}
								</p>
								{mediaError?.message.includes("拒否") && (
									<div className="pt-2 border-t border-destructive/20">
										<p className="text-xs text-center text-muted-foreground">
											💡
											ブラウザのアドレスバー横のカメラアイコンをクリックして、アクセスを許可してください
										</p>
									</div>
								)}
							</Card>
						)}

						<Card className="p-6 sm:p-8 md:p-10 text-center border-2 border-primary/20 shadow-xl space-y-6 sm:space-y-8 bg-card/50 backdrop-blur-sm">
							<div className="space-y-3 sm:space-y-4">
								<h2 className="text-2xl sm:text-3xl font-bold text-foreground">
									Are you ready?
								</h2>
								<p className="text-muted-foreground text-sm sm:text-base md:text-lg">
									カメラとマイクへのアクセスを許可して
									<br />
									会話を始めよう!
								</p>
							</div>
							{/* Avatar Selection (Image Buttons) */}
							<div className="grid grid-cols-3 gap-4">
								<button
									type="button"
									onClick={() => setSelectedAvatar("female")}
									className={`group relative overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 ${
										selectedAvatar === "female"
											? "border-primary shadow-lg"
											: "border-border hover:border-primary/40"
									}`}
									aria-pressed={selectedAvatar === "female"}
									aria-label="女性アバターを選択"
								>
									<div className="relative w-full aspect-[4/3]">
										<Image
											src="/maki.webp"
											alt="女性アバター"
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
											sizes="(max-width: 768px) 50vw, 240px"
											priority
										/>
									</div>
									<div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
										女性アバター
									</div>
								</button>

								<button
									type="button"
									onClick={() => setSelectedAvatar("male")}
									className={`group relative overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 ${
										selectedAvatar === "male"
											? "border-primary shadow-lg"
											: "border-border hover:border-primary/40"
									}`}
									aria-pressed={selectedAvatar === "male"}
									aria-label="男性アバターを選択"
								>
									<div className="relative w-full aspect-[4/3]">
										<Image
											src="/rento.png"
											alt="男性アバター"
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
											sizes="(max-width: 768px) 50vw, 240px"
											priority
										/>
									</div>
									<div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
										男性アバター
									</div>
								</button>

								<button
									type="button"
									onClick={() => setSelectedAvatar("neutral")}
									className={`group relative overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 ${
										selectedAvatar === "neutral"
											? "border-primary shadow-lg"
											: "border-border hover:border-primary/40"
									}`}
									aria-pressed={selectedAvatar === "neutral"}
									aria-label="中性アバターを選択"
								>
									<div className="relative w-full aspect-[4/3]">
										<Image
											src="/kouta.png"
											alt="中性アバター"
											fill
											className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
											sizes="(max-width: 768px) 33vw, 240px"
											priority
										/>
									</div>
									<div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
										中性アバター
									</div>
								</button>
							</div>
							{/* Background Selection (Image Buttons) */}
							<div className="space-y-2 text-left">
								<h3 className="text-base sm:text-lg font-semibold text-foreground">
									背景を選択
								</h3>
								<div className="grid grid-cols-3 gap-4">
									{(Object.keys(BACKGROUNDS) as Array<BackgroundKey>).map(
										(key) => {
											const bg = BACKGROUNDS[key];
											const selected = selectedBackground === key;
											return (
												<button
													key={key}
													type="button"
													onClick={() => setSelectedBackground(key)}
													className={`group relative overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 ${
														selected
															? "border-primary shadow-lg"
															: "border-border hover:border-primary/40"
													}`}
													aria-pressed={selected}
													aria-label={`${bg.label}の背景を選択`}
												>
													<div className="relative w-full aspect-[4/3]">
														<Image
															src={bg.src}
															alt={`${bg.label}の背景`}
															fill
															className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
															sizes="(max-width: 768px) 33vw, 240px"
															priority={false}
														/>
													</div>
													<div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
														{bg.label}
													</div>
												</button>
											);
										},
									)}
								</div>
								{/* Situation Hint */}
								<div className="mt-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-lg p-3">
									<p className="font-semibold text-foreground mb-1">
										シチュエーション
									</p>
									<p>{BACKGROUNDS[selectedBackground].scenario}</p>
								</div>
								{/* Assist Mode Toggle */}
								<div className="mt-2 text-xs sm:text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-lg p-3 flex items-center justify-between gap-3">
									<div>
										<p className="font-semibold text-foreground mb-0.5">モード選択</p>
										<p>アシストモードでは会話中に高得点のコツ（アドバイス）を表示します。</p>
									</div>
									<label className="flex items-center gap-2 cursor-pointer select-none">
										<input
											type="checkbox"
											checked={assistMode}
											onChange={(e) => setAssistMode(e.target.checked)}
											className="h-4 w-4"
											aria-label="アシストモードを有効化"
										/>
										<span className="text-foreground text-xs whitespace-nowrap">アシストモード</span>
									</label>
								</div>
							</div>
							<Button
								size="lg"
								className="rounded-full px-8 sm:px-10 md:px-12 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
								onClick={handleStartConversation}
							>
								<Video className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />"{avatarName}
								"にはなしかける
							</Button>
						</Card>
					</div>
				</main>
			) : (
				/* Conversation State - Split Screen Layout */
				<main className="flex-1 flex flex-col overflow-hidden">
					<div className="flex-1 relative">
						{/* Background image + overlay */}
						<div className="absolute inset-0 -z-10">
							<Image
								src={BACKGROUNDS[selectedBackground].src}
								alt={`${BACKGROUNDS[selectedBackground].label}の背景`}
								fill
								sizes="100vw"
								priority={false}
								className="object-cover"
							/>
							<div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/40 to-black/80" />
						</div>
						<div className="w-full h-full flex flex-col md:flex-row gap-2 p-2">
							{/* AI Avatar */}
							<AvatarDisplay
								modelUrl={avatarModelUrl}
								lipSyncValue={lipSyncValue}
								emotion={avatarEmotion}
								gesture={avatarGesture}
								avatarName={avatarName}
												backgroundSrc={BACKGROUNDS[selectedBackground].src}
							/>

							{/* User Video */}
							<UserVideoDisplay
								ref={videoStreamRef}
								stream={stream}
								videoEnabled={videoEnabled}
								onVideoReady={handleVideoReady}
							/>

							{/* Advice Checklist (アシストモード時のみ表示) */}
							{assistMode && (
								<div className="md:absolute md:left-2 md:top-2 md:w-64 md:z-10 w-full md:w-auto">
									<AdviceChecklist
										title="背景に合わせたアドバイス"
										items={BACKGROUND_ADVICE[selectedBackground].map(item => ({
											id: item.id,
											label: item.label,
											checked: !!adviceCompleted[item.id],
										}))}
									/>
								</div>
							)}
						</div>

						{/* Recording Status Indicator */}
						<RecordingStatus
							isRecording={isRecording}
							isProcessing={isProcessing}
						/>

						{/* Error Messages */}
						<ErrorDisplay
							mediaError={mediaError}
							recorderError={recorderError}
							facialError={facialError}
							conversationError={conversationError}
						/>

						{/* Conversation History Panel */}
						<ConversationHistoryPanel
							messages={messages}
							showHistory={showHistory}
							onToggleHistory={setShowHistory}
						/>
					</div>

					{/* Control Panel */}
					<ConversationControls
						isRecording={isRecording}
						isProcessing={isProcessing}
						videoEnabled={videoEnabled}
						stream={stream}
						audioURL={audioURL}
						showControls={showControls}
						timeRemaining={timeRemaining}
						messageCount={messages.length}
						avatarName={avatarName}
						onToggleRecording={toggleRecording}
						onToggleVideo={toggleVideo}
						onEndConversation={handleEndConversation}
						onToggleControls={() => setShowControls(!showControls)}
					/>
				</main>
			)}
		</div>
	);
}
