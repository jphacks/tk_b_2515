"use client";

import {
  ArrowLeft,
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
  Send,
  Smile,
} from "lucide-react";
import Link from "next/link";
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
import { useConversation } from "@/hooks/useConversation";
import { VideoStream, type VideoStreamRef } from "@/components/VideoStream";
import { ConversationHistory } from "@/components/ConversationHistory";
import dynamic from "next/dynamic";
import { logMediaRecorderSupport } from "@/lib/mediaRecorderSupport";
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
  | "armsCrossed"
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

  // ビデオが準備できたら表情分析を開始
  const handleVideoReady = useCallback(
    (videoElement: HTMLVideoElement) => {
      console.log("ビデオ準備完了、表情分析を開始します");
      // アバターは画面左側にあるので、左側中央（x: 0.25, y: 0.5）を見るのが適切
      startAnalysis(videoElement, { x: 0.25, y: 0.5 });
    },
    [startAnalysis]
  );

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
          width: { ideal: 640 }, // 解像度を下げて負荷軽減
          height: { ideal: 480 }, // 解像度を下げて負荷軽減
          frameRate: { ideal: 24 }, // フレームレートを下げて負荷軽減
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
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  }, [startStream, startSession]);

  const handleEndConversation = useCallback(async () => {
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
        "armsCrossed",
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
    <div className="min-h-screen flex flex-col gradient-pink">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-card/60 backdrop-blur-md border-b border-border/30 soft-shadow">
        <Link href="/">
          <Button variant="ghost" size="lg" className="heart-effect">
            <ArrowLeft className="w-5 h-5 mr-2" />
            ホームへ
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center soft-shadow">
            <Heart className="w-5 h-5 text-primary-foreground fill-current animate-soft-pulse" />
          </div>
          <span className="font-bold text-foreground text-xl">恋AI</span>
        </div>
        <div className="w-32" /> {/* Spacer for alignment */}
      </header>

      {!conversationStarted ? (
        /* Initial State - Full Screen Welcome */
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-12 animate-fade-in-up">
            <div className="text-center space-y-6">
              <div className="inline-block p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6 soft-shadow">
                <Heart className="w-24 h-24 text-primary animate-soft-pulse" />
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                会話シミュレーション
              </h1>
              <p className="text-muted-foreground text-xl leading-relaxed">
                AI女子と会話の練習をしましょう
                <br />
                自然な対話でコミュニケーション能力を向上させます
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

            <Card
              className="text-center space-y-8 animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-foreground">
                  準備はできましたか？
                </h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  カメラとマイクへのアクセスを許可して
                  <br />
                  会話を始めましょう
                </p>
              </div>
              <Button
                size="xl"
                className="heart-effect animate-gentle-bounce"
                onClick={handleStartConversation}
              >
                <Video className="w-6 h-6 mr-3" />
                会話を始める
              </Button>
            </Card>
          </div>
        </main>
      ) : (
        /* Conversation State - Chat Layout */
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Container */}
          <div className="flex-1 relative bg-gradient-to-br from-background/80 via-background/60 to-primary/5">
            <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
              {/* AI Avatar - Left Side */}
              <div className="w-full lg:w-80 h-64 lg:h-full relative bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl overflow-hidden border-2 border-primary/20 soft-shadow-lg">
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto soft-shadow">
                          <Heart className="w-8 h-8 text-primary animate-soft-pulse" />
                        </div>
                        <p className="text-muted-foreground font-medium">
                          AI女子を読み込み中...
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
                {/* AI Label */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-primary/90 to-primary/80 backdrop-blur-sm px-4 py-2 rounded-2xl border border-primary-foreground/20 soft-shadow">
                  <p className="text-primary-foreground font-semibold text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 fill-current" />
                    AI女子
                  </p>
                </div>
              </div>

              {/* Chat History - Right Side */}
              <div className="flex-1 flex flex-col bg-card/60 backdrop-blur-sm rounded-3xl border-2 border-border/30 soft-shadow-lg overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground">会話履歴</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      {messages.length} メッセージ
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-xl"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-hidden">
                  <MemoizedConversationHistory
                    messages={messages}
                    className="h-full"
                  />
                </div>
              </div>
            </div>

            {/* User Camera - Small floating window */}
            {stream && videoEnabled && (
              <div className="absolute bottom-24 right-6 w-48 h-36 bg-black rounded-2xl overflow-hidden border-2 border-border/50 soft-shadow-lg">
                <MemoizedVideoStream
                  ref={videoStreamRef}
                  stream={stream}
                  className="w-full h-full object-cover"
                  onVideoReady={handleVideoReady}
                />
                {/* User Label */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <p className="text-white font-semibold text-xs flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    あなた
                  </p>
                </div>
              </div>
            )}

            {/* Recording Status Indicator - Floating Top Right */}
            <div className="absolute top-6 right-6 flex items-center gap-3 bg-card/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border/30 soft-shadow">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRecording
                    ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                    : isProcessing
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-muted-foreground"
                }`}
              />
              <span className="text-foreground font-medium text-sm">
                {isProcessing ? "処理中" : isRecording ? "録音中" : "待機中"}
              </span>
            </div>

            {/* Error Messages - Floating Top Center */}
            {(mediaError ||
              recorderError ||
              facialError ||
              conversationError) && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-lg z-50">
                <div className="bg-card/95 backdrop-blur-md text-foreground px-6 py-4 rounded-2xl soft-shadow-lg border-2 border-destructive/30 space-y-2">
                  <p className="text-sm font-bold text-center flex items-center justify-center gap-2 text-destructive">
                    <span className="text-lg">⚠️</span>
                    エラーが発生しました
                  </p>
                  <p className="text-sm text-center text-muted-foreground">
                    {mediaError?.message ||
                      recorderError?.message ||
                      facialError?.message ||
                      conversationError?.message}
                  </p>
                  {mediaError?.message.includes("拒否") && (
                    <div className="pt-2 border-t border-border/30">
                      <p className="text-xs text-center text-muted-foreground">
                        💡
                        ブラウザのアドレスバー横のカメラアイコンをクリックして、アクセスを許可してください
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Control Panel - Bottom Fixed */}
          <div className="bg-card/80 backdrop-blur-md border-t border-border/30 soft-shadow-lg relative">
            {/* Toggle Button - Floating above controls */}
            <button
              type="button"
              onClick={() => setShowControls(!showControls)}
              className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md border border-border/30 rounded-2xl px-4 py-2 soft-shadow hover:soft-shadow-lg transition-all"
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
                    ? "AIが応答を生成しています..."
                    : isRecording
                    ? "話している内容が記録されています"
                    : "マイクボタンを押して録音を開始してください"}
                </p>
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
                      録音停止
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6 mr-2" />
                      録音開始
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
