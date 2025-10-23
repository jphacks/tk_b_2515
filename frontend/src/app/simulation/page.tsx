"use client";

import {
  Heart,
  Mic,
  MicOff,
  Phone,
  Video,
  VideoOff,
  Loader2,
  MessageSquare,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  useState,
  Suspense,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useFacialAnalysis } from "@/hooks/useFacialAnalysis";
import { preloadVRM } from "@/hooks/useVRM";
import { useConversation } from "@/hooks/useConversation";
import { VideoStream, type VideoStreamRef } from "@/components/VideoStream";
import { ConversationHistory } from "@/components/ConversationHistory";
import dynamic from "next/dynamic";
import { logMediaRecorderSupport } from "@/lib/mediaRecorderSupport";
import { config } from "@/lib/config";
import { gestureApi } from "@/lib/api";
import type { SaveGestureMetricsRequest } from "@/types/api";

// VRMアバターを動的インポート（SSR回避）
const ConversationAvatar = dynamic(
  () => import("@/components/Avatar/ConversationAvatar"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="w-16 h-16 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">アバターを読み込み中...</p>
        </div>
      </div>
    ),
  }
);

// メモ化されたビデオストリームコンポーネント
const MemoizedVideoStream = memo(VideoStream);

// メモ化された会話履歴コンポーネント
const MemoizedConversationHistory = memo(ConversationHistory);

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

  // video要素への参照
  const videoStreamRef = useRef<VideoStreamRef>(null);

  // メディアデバイス（カメラ・マイク）へのアクセス
  const {
    stream,
    error: mediaError,
    startStream,
    stopStream,
  } = useMediaDevices();

  // 音声録音機能
  const {
    isRecording,
    audioURL,
    audioBlobs,
    error: recorderError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();

  // 表情分析機能（メトリクスは現在未使用だが、バックグラウンドで分析を実行）
  const {
    metrics: facialMetrics,
    error: facialError,
    startAnalysis,
    stopAnalysis,
  } = useFacialAnalysis();

  // リップシンク更新のメモ化（不要な再生成を防ぐ）
  const handleLipSyncUpdate = useCallback((value: number) => {
    setLipSyncValue(value);
  }, []);

  // 会話管理（STT → AI → TTS）
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
    ttsVoiceId: config.tts.voiceId || undefined,
  });

  // デモ用VRMモデルURL（実際のプロジェクトのVRMファイルパスに変更してください）
  // innocent_girl.vrm を `/public/models/` に配置している想定
  const avatarModelUrl = "/models/innocent_girl.vrm";

  const gestureStatsRef = useRef({
    totalSamples: 0,
    smilingSamples: 0,
    smileIntensitySum: 0,
    smileIntensityMax: 0,
    gazeScoreSum: 0,
    lookingSamples: 0,
    gazeUpSamples: 0,
    gazeDownSamples: 0,
  });

  // MediaRecorderサポート情報をログ出力（開発時のデバッグ用）
  useEffect(() => {
    logMediaRecorderSupport();
    // VRMモデルを事前プリロードして初回表示を高速化
    preloadVRM(avatarModelUrl).catch(() => {
      // 失敗しても致命的ではないので無視
    });
  }, []);

  useEffect(() => {
    if (!facialMetrics) return;
    const stats = gestureStatsRef.current;
    stats.totalSamples += 1;
    stats.smileIntensitySum += facialMetrics.smileIntensity;
    stats.gazeScoreSum += facialMetrics.gazeScore;
    if (facialMetrics.smileIntensity > stats.smileIntensityMax) {
      stats.smileIntensityMax = facialMetrics.smileIntensity;
    }
    if (facialMetrics.isSmiling) {
      stats.smilingSamples += 1;
    }
    if (facialMetrics.isLookingAtTarget) {
      stats.lookingSamples += 1;
    }
    if (facialMetrics.gazeVertical === "up") {
      stats.gazeUpSamples += 1;
    } else if (facialMetrics.gazeVertical === "down") {
      stats.gazeDownSamples += 1;
    }
  }, [facialMetrics]);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (conversationStarted && timeRemaining !== null) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null) return prev;
          const next = prev - 1;
          if (next < 0) {
            if (interval) clearInterval(interval);
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [conversationStarted, timeRemaining]);

  // ビデオが準備できたら表情分析を開始
  const handleVideoReady = useCallback(
    (videoElement: HTMLVideoElement) => {
      console.log("ビデオ準備完了、表情分析を開始します");
      // アバターは画面左側にあるので、左側中央（x: 0.25, y: 0.5）を見るのが適切
      startAnalysis(videoElement, { x: 0.25, y: 0.5 });
    },
    [startAnalysis]
  );

  const handleEndConversation = useCallback(async () => {
    setTimeRemaining(null);
    // 録音を停止
    if (isRecording) {
      stopRecording();
    }
    // 表情分析を停止
    stopAnalysis();
    // 会話セッションを終了
    if (session?.id) {
      const stats = gestureStatsRef.current;
      if (stats.totalSamples > 0) {
        const payload: SaveGestureMetricsRequest = {
          totalSamples: stats.totalSamples,
          smilingSamples: stats.smilingSamples,
          smileIntensityAvg: stats.smileIntensitySum / stats.totalSamples,
          smileIntensityMax: stats.smileIntensityMax,
          gazeScoreAvg: stats.gazeScoreSum / stats.totalSamples,
          lookingSamples: stats.lookingSamples,
          gazeUpSamples: stats.gazeUpSamples,
          gazeDownSamples: stats.gazeDownSamples,
        };

        try {
          await gestureApi.saveMetrics(session.id, payload);
        } catch (error) {
          console.error("Failed to save gesture metrics:", error);
        }
      }
    }

    await endSession();
    // メディアストリームを停止
    stopStream();
    // フィードバックページへ遷移（セッションIDを渡す）
    if (session?.id) {
      window.location.href = `/feedback?sessionId=${session.id}`;
    } else {
      window.location.href = "/feedback";
    }
  }, [
    isRecording,
    stopRecording,
    stopAnalysis,
    endSession,
    stopStream,
    session?.id,
  ]);

  // 3分経過時に自動的にフィードバックページに遷移
  useEffect(() => {
    if (timeRemaining === 0 && conversationStarted) {
      console.log("Time reached 0, redirecting to feedback page");
      // タイムアウト時は直接フィードバックページへ遷移
      handleEndConversation();
    }
  }, [timeRemaining, conversationStarted, handleEndConversation]);

  const handleStartConversation = useCallback(async () => {
    try {
      gestureStatsRef.current = {
        totalSamples: 0,
        smilingSamples: 0,
        smileIntensitySum: 0,
        smileIntensityMax: 0,
        gazeScoreSum: 0,
        lookingSamples: 0,
        gazeUpSamples: 0,
        gazeDownSamples: 0,
      };
      // カメラとマイクへのアクセスを開始（パフォーマンス重視設定）
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
      // 会話セッションを開始
      await startSession();
      setConversationStarted(true);

      // 3分のタイマーを設定（カウントダウンはuseEffectで管理）
      setTimeRemaining(3 * 60);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [startStream, startSession]);

  const toggleRecording = useCallback(() => {
    if (!stream) return;

    if (!isRecording) {
      // 録音を開始
      startRecording(stream);
    } else {
      // 録音を停止して、音声を送信
      stopRecording();
    }
  }, [stream, isRecording, startRecording, stopRecording]);

  // 録音が停止されたら、音声を送信
  useEffect(() => {
    if (audioBlobs.length === 0 || isRecording || !session) return;

    const sendRecordedAudio = async () => {
      console.log("Sending recorded audio...");
      // audioBlobsを1つのBlobに結合
      const audioBlob = new Blob(audioBlobs, {
        type: audioBlobs[0]?.type || "audio/webm",
      });
      await sendAudio(audioBlob);
      // 録音をクリア
      clearRecording();
    };

    sendRecordedAudio();
  }, [audioBlobs, isRecording, session, sendAudio, clearRecording]);

  // ランダムな感情変化（会話が始まったら）
  useEffect(() => {
    if (!conversationStarted) return;

    const emotions: Array<"neutral" | "happy" | "sad" | "surprised" | "angry"> =
      [
        "happy",
        "happy",
        "happy", // happy を多めに
        "neutral",
        "neutral",
        "surprised",
      ];

    // 10〜20秒ごとにランダムに感情を変える
    const emotionInterval = setInterval(() => {
      const randomEmotion =
        emotions[Math.floor(Math.random() * emotions.length)];
      setAvatarEmotion(randomEmotion);
    }, 10000 + Math.random() * 10000);

    return () => clearInterval(emotionInterval);
  }, [conversationStarted]);

  // 録音・処理状態に応じてジェスチャーを変化させる
  useEffect(() => {
    if (isRecording) {
      // 録音中はうなずいたり、傾聴の姿勢
      setAvatarGesture("nodding");
    } else if (isProcessing) {
      // 処理中は考え中のジェスチャー
      setAvatarGesture("thinking");
    } else if (lipSyncValue > 0.1) {
      // 話している時は手を動かす
      setAvatarGesture("talking");
    } else {
      // それ以外はアイドル状態
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
      <header className="h-16 px-4 flex items-center justify-between bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
                {/* Left: icon */}
                <div className="w-24 flex items-center justify-center h-full">
                  <div className="relative h-[80%] w-[80%]">
                    <Image
                      src="/a.png"
                      alt="恋AIのアイコン"
                      fill
                      className="object-cover rounded-full"
                    />
                  </div>
                </div>
      
                {/* Center: title */}
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-primary fill-primary animate-pulse" />
                  <span className="font-bold text-foreground text-lg">恋AI</span>
                </div>
      
                {/* Right: Home button */}
                <div className="w-24 flex items-center justify-center">
                  <Link href="/">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full hover:bg-primary/10"
                    >
                      {/* Keep ArrowLeft for a recognizable 'back/home' affordance */}
                      ホーム
                    </Button>
                  </Link>
                </div>
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
                まきと会話の練習をしましょう
              </p>
            </div>

            {/* エラーメッセージ（初期画面） */}
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

            <Card className="p-10 text-center border-2 border-primary/20 shadow-xl space-y-8 bg-card/50 backdrop-blur-sm">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-foreground">
                  Are you ready?
                </h2>
                <p className="text-muted-foreground text-lg">
                  カメラとマイクへのアクセスを許可して
                  <br />
                  会話を始めよう!
                </p>
              </div>
              <Button
                size="lg"
                className="rounded-full px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={handleStartConversation}
              >
                <Video className="w-6 h-6 mr-2" />
                "まき"にはなしかける
              </Button>
            </Card>
          </div>
        </main>
      ) : (
        /* Conversation State - Split Screen Layout */
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Video Container - Split view: AI Avatar (left) + User Camera (right) */}
          <div className="flex-1 relative bg-gradient-to-br from-black/95 via-primary/5 to-black/95">
            <div className="w-full h-full flex flex-col md:flex-row gap-2 p-2">
              {/* AI Avatar - Main Area (Left Side on desktop, Top on mobile) */}
              <div className="flex-1 relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl overflow-hidden border border-primary/20 shadow-2xl min-h-[360px] md:min-h-[420px]">
                <div className="absolute inset-0">
                  <Suspense
                    fallback={
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Heart className="w-16 h-16 text-primary animate-pulse mx-auto" />
                          <p className="text-muted-foreground">
                            まきをよびだしちゅう...
                          </p>
                        </div>
                      </div>
                    }
                  >
                    <ConversationAvatar
                      modelUrl={avatarModelUrl}
                      lipSyncValue={lipSyncValue}
                      emotion={avatarEmotion}
                      gesture={avatarGesture}
                      className="w-full h-full"
                    />
                  </Suspense>
                </div>
                {/* AI Label */}
                <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-foreground/20">
                  <p className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-current" />
                    まき
                  </p>
                </div>
              </div>

              {/* User Camera - Secondary Area (Right Side on desktop, Bottom on mobile) */}
              <div className="w-full md:w-80 h-48 md:h-auto relative bg-black rounded-xl overflow-hidden border border-border/50 shadow-2xl flex flex-col">
                {stream && videoEnabled ? (
                  <>
                    <div className="flex-1 relative">
                      <MemoizedVideoStream
                        ref={videoStreamRef}
                        stream={stream}
                        className="w-full h-full object-cover"
                        onVideoReady={handleVideoReady}
                      />
                      {/* User Label */}
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                        <p className="text-white font-semibold text-sm flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          あなた
                        </p>
                      </div>
                    </div>

                    {/* Facial Feedback Overlay - フィードバックページでのみ表示されるため、ここでは非表示 */}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
                    <VideoOff className="w-16 h-16 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm text-center px-4">
                      cameraが
                      <br />
                      offです
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recording Status Indicator - Floating Top Right */}
            <div className="absolute top-6 right-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
              <div
                className={`w-4 h-4 rounded-full ${
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                    : isProcessing
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-gray-500"
                }`}
              />
              <span className="text-white font-semibold text-sm">
                {isProcessing ? "処理中" : isRecording ? "録音中" : "待機中"}
              </span>
            </div>

            {/* Error Messages - Floating Top Center */}
            {(mediaError ||
              recorderError ||
              facialError ||
              conversationError) && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-lg z-50">
                <div className="bg-destructive/95 backdrop-blur-md text-destructive-foreground px-6 py-4 rounded-lg shadow-2xl border-2 border-destructive space-y-2">
                  <p className="text-sm font-bold text-center flex items-center justify-center gap-2">
                    <span className="text-lg">⚠️</span>
                    エラーが発生しました
                  </p>
                  <p className="text-sm text-center">
                    {mediaError?.message ||
                      recorderError?.message ||
                      facialError?.message ||
                      conversationError?.message}
                  </p>
                  {mediaError?.message.includes("拒否") && (
                    <div className="pt-2 border-t border-destructive-foreground/20">
                      <p className="text-xs text-center text-destructive-foreground/90">
                        💡
                        ブラウザのアドレスバー横のカメラアイコンをクリックして、アクセスを許可してください
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conversation History Panel - Floating Bottom Right */}
            {showHistory && (
              <div className="absolute bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300">
                <Card className="bg-card/95 backdrop-blur-md border-border/50 shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">会話履歴</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowHistory(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="h-96 overflow-hidden">
                    <MemoizedConversationHistory
                      messages={messages}
                      className="h-full p-4"
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Toggle History Button - Floating Bottom Right (when history is hidden) */}
            {!showHistory && messages.length > 0 && (
              <Button
                variant="default"
                size="lg"
                className="absolute bottom-4 right-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
                onClick={() => setShowHistory(true)}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                話した内容 ({messages.length})
              </Button>
            )}
          </div>

          {/* Control Panel - Bottom Fixed */}
          <div className="bg-card/95 backdrop-blur-md border-t border-border/50 shadow-2xl relative">
            {/* Toggle Button - Floating above controls */}
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/50 rounded-t-lg px-4 py-2 shadow-lg hover:bg-card transition-all"
            >
              {showControls ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <div
              className={`max-w-4xl mx-auto px-6 space-y-4 transition-all duration-300 overflow-hidden ${
                showControls
                  ? "py-6 max-h-96 opacity-100"
                  : "py-0 max-h-0 opacity-0"
              }`}
            >
              {/* Status Text */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isProcessing
                    ? "まきが考えてるよ"
                    : isRecording
                    ? "まきが考えてるよ"
                    : "「はなしかける」を押してまきに話しかけよう!"}
                </p>
                {conversationStarted && timeRemaining !== null && (
                  <p className="text-xs text-primary mt-2">
                    残り時間: {Math.floor(timeRemaining / 60)}分
                    {`${timeRemaining % 60}`.padStart(2, "0")}秒
                  </p>
                )}
                {messages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    会話ターン数: {Math.floor(messages.length / 2)}
                  </p>
                )}
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
                  variant={isRecording ? "secondary" : "default"}
                  className="rounded-full h-16 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={toggleRecording}
                  disabled={!stream || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      処理中
                    </>
                  ) : isRecording ? (
                    <>
                      <MicOff className="w-6 h-6 mr-2" />
                      はなしおわる
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6 mr-2" />
                      はなしかける
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
                  会話終了
                </Button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
