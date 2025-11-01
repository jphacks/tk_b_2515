"use client";

import { Heart, Video } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useFacialAnalysis } from "@/hooks/useFacialAnalysis";
import { preloadVRM } from "@/hooks/useVRM";
import { useConversation } from "@/hooks/useConversation";
import { useGestureTracking } from "@/hooks/useGestureTracking";
import { useSimulationTimer } from "@/hooks/useSimulationTimer";
import type { VideoStreamRef } from "@/components/VideoStream";
import {
  AvatarDisplay,
  UserVideoDisplay,
  RecordingStatus,
  ErrorDisplay,
  ConversationControls,
  ConversationHistoryPanel,
} from "@/components/simulation";
import { logMediaRecorderSupport } from "@/lib/mediaRecorderSupport";
import { config } from "@/lib/config";
import { gestureApi } from "@/lib/api";

type GestureType =
  | "idle"
  | "thinking"
  | "talking"
  | "explaining"
  | "nodding";

export default function SimulationPage() {
  const [conversationStarted, setConversationStarted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [lipSyncValue, setLipSyncValue] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [avatarEmotion, setAvatarEmotion] = useState<
    "neutral" | "happy" | "sad" | "surprised" | "angry"
  >("happy");
  const [avatarGesture, setAvatarGesture] = useState<GestureType>("idle");
  const [selectedAvatar, setSelectedAvatar] = useState<"female" | "male">("female");

  const videoStreamRef = useRef<VideoStreamRef>(null);
  const avatarModelUrl = useMemo(
    () => (selectedAvatar === "male" ? "/models/rento.vrm" : "/models/maki.vrm"),
    [selectedAvatar]
  );
  const avatarName = useMemo(() => {  // プログラムを改善すればアバターの名前を日本語表記にすることも可能
    const parts = avatarModelUrl.split("/");
    const file = parts[parts.length - 1] || "";
    return file.replace(/\.vrm$/i, "");
  }, [avatarModelUrl]);
  const selectedVoiceId = useMemo(() => {
    const femaleId = config.tts.voices?.female || config.tts.voiceId || "";
    const maleId = config.tts.voices?.male || "";
    return selectedAvatar === "male" ? (maleId || config.tts.voiceId || "") : femaleId;
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
  });

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
  }, [avatarModelUrl]);

  // Video ready handler
  const handleVideoReady = useCallback(
    (videoElement: HTMLVideoElement) => {
      console.log("ビデオ準備完了、表情分析を開始します");
      startAnalysis(videoElement, { x: 0.25, y: 0.5 });
    },
    [startAnalysis]
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
    if (audioBlobs.length === 0 || isRecording || !session) return;

    const sendRecordedAudio = async () => {
      console.log("Sending recorded audio...");
      const audioBlob = new Blob(audioBlobs, {
        type: audioBlobs[0]?.type || "audio/webm",
      });
      await sendAudio(audioBlob);
      clearRecording();
    };

    sendRecordedAudio();
  }, [audioBlobs, isRecording, session, sendAudio, clearRecording]);

  // Random emotion changes
  useEffect(() => {
    if (!conversationStarted) return;

    const emotions: Array<"neutral" | "happy" | "sad" | "surprised" | "angry"> =
      ["happy", "happy", "happy", "neutral", "neutral", "surprised"];

    const emotionInterval = setInterval(() => {
      const randomEmotion =
        emotions[Math.floor(Math.random() * emotions.length)];
      setAvatarEmotion(randomEmotion);
    }, 10000 + Math.random() * 10000);

    return () => clearInterval(emotionInterval);
  }, [conversationStarted]);

  // Gesture changes based on recording/processing state
  useEffect(() => {
    if (isRecording) {
      setAvatarGesture("nodding");
    } else if (isProcessing) {
      setAvatarGesture("thinking");
    } else if (lipSyncValue > 0.1) {
      setAvatarGesture("talking");
    } else {
      const gestures: GestureType[] = [
        "idle",
        "idle",
        "idle",
        "explaining",
      ];
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
      {/* Header */}
      <header className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="w-10 sm:w-12 md:w-16 flex items-center justify-center">
          <Link href="/">
            <button
              type="button"
              className="relative h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:opacity-80 transition-opacity"
              aria-label="ホームに戻る"
            >
              <Image
                src="/a.png"
                alt="恋AIのアイコン"
                fill
                className="object-contain"
              />
            </button>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary animate-pulse" />
          <span className="font-bold text-foreground text-base sm:text-lg">恋AI</span>
        </div>

        <div className="w-10 sm:w-12 md:w-16 flex items-center justify-center">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-primary/10 text-xs sm:text-sm px-2 sm:px-3"
            >
              ホーム
            </Button>
          </Link>
        </div>
      </header>

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
              <div className="grid grid-cols-2 gap-4">
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
                      src="/maki.png"
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
              </div>
              <Button
                size="lg"
                className="rounded-full px-8 sm:px-10 md:px-12 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={handleStartConversation}
              >
                <Video className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                "{avatarName}"にはなしかける
              </Button>
            </Card>
          </div>
        </main>
      ) : (
        /* Conversation State - Split Screen Layout */
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative bg-gradient-to-br from-black/95 via-primary/5 to-black/95">
            <div className="w-full h-full flex flex-col md:flex-row gap-2 p-2">
              {/* AI Avatar */}
              <AvatarDisplay
                modelUrl={avatarModelUrl}
                lipSyncValue={lipSyncValue}
                emotion={avatarEmotion}
                gesture={avatarGesture}
                avatarName={avatarName}
              />

              {/* User Video */}
              <UserVideoDisplay
                ref={videoStreamRef}
                stream={stream}
                videoEnabled={videoEnabled}
                onVideoReady={handleVideoReady}
              />
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
