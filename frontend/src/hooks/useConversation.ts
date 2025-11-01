import { useCallback, useEffect, useRef, useState } from "react";
import {
  conversationApi,
  sessionApi,
  speechToText,
  textToSpeechUrl,
} from "@/lib/api";
import type { ConversationSession, Message } from "@/types/api";
import type { VoiceAnalysisResult } from "@/lib/audio/voiceAnalysis";
import { useLipSync } from "./useLipSync";

interface UseConversationOptions {
  systemPrompt?: string;
  onAudioReady?: (audioUrl: string) => void;
  onLipSyncUpdate?: (value: number) => void;
  ttsVoiceId?: string;
  onEmotionUpdate?: (
    emotion: "neutral" | "happy" | "sad" | "surprised" | "angry" | "bashful"
  ) => void;
}

interface ConversationState {
  session: ConversationSession | null;
  messages: Message[];
  isProcessing: boolean;
  error: Error | null;
  currentAudioUrl: string | null;
}

export function useConversation(options: UseConversationOptions) {
  const {
    systemPrompt,
    onAudioReady,
    onLipSyncUpdate,
    ttsVoiceId,
    onEmotionUpdate,
  } = options;

  const [state, setState] = useState<ConversationState>({
    session: null,
    messages: [],
    isProcessing: false,
    error: null,
    currentAudioUrl: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // リップシンクを統合
  const lipSyncValue = useLipSync(audioRef.current);

  // セッションを開始
  const startSession = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      // localStorageから既存のuserIdを取得
      let existingUserId: string | null = null;
      if (typeof window !== "undefined" && !currentUserId) {
        existingUserId = localStorage.getItem("conversationUserId");
        console.log("Existing user ID from localStorage:", existingUserId);
      }

      // 既存のuserIdがあればそれを使用、なければバックエンドで新規作成
      const session = await sessionApi.createSession(
        currentUserId || existingUserId || undefined
      );

      // userIdをlocalStorageに保存して永続化
      if (session.userId && typeof window !== "undefined") {
        localStorage.setItem("conversationUserId", session.userId);
        console.log("User ID saved to localStorage:", session.userId);
      }

      setState((prev) => ({
        ...prev,
        session,
        isProcessing: false,
      }));
      return session;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setState((prev) => ({
        ...prev,
        error: err,
        isProcessing: false,
      }));
      throw err;
    }
  }, [currentUserId]);

  // セッションを終了
  const endSession = useCallback(async () => {
    if (!state.session) return;

    try {
      setState((prev) => ({ ...prev, isProcessing: true }));
      await sessionApi.finishSession(state.session.id);
      setState((prev) => ({
        ...prev,
        isProcessing: false,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      setState((prev) => ({
        ...prev,
        error: err,
        isProcessing: false,
      }));
    }
  }, [state.session]);

  // リップシンク値を親コンポーネントに通知
  useEffect(() => {
    if (onLipSyncUpdate) {
      onLipSyncUpdate(lipSyncValue);
    }
  }, [lipSyncValue, onLipSyncUpdate]);

  // 音声を送信して応答を取得（STT → AI → TTS）
  const sendAudio = useCallback(
    async (
      audioBlob: Blob,
      _voiceAnalysis?: VoiceAnalysisResult | null
    ): Promise<Message | null> => {
      if (!state.session) {
        throw new Error("No active session");
      }

      try {
        setState((prev) => ({ ...prev, isProcessing: true, error: null }));

        // 1. STT: 音声をテキストに変換
        const audioFile = new File([audioBlob], "recording.webm", {
          type: audioBlob.type,
        });
        const sttResult = await speechToText({
          audio: audioFile,
        });

        console.log("STT Result:", sttResult.text);

        // 2. AI: テキストから応答を生成
        const aiResponse = await conversationApi.generateResponse({
          sessionId: state.session.id,
          userMessage: sttResult.text,
          systemPrompt,
        });

        console.log(
          "AI Response:",
          aiResponse.response,
          "Emotion:",
          aiResponse.emotion
        );

        // Emotion update to UI
        if (onEmotionUpdate) {
          onEmotionUpdate(aiResponse.emotion);
        }

        // メッセージを状態に追加
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            aiResponse.userMessage,
            aiResponse.assistantMessage,
          ],
        }));

        // 3. TTS: AIの応答を音声に変換
        console.log("Starting TTS for text:", aiResponse.response);
        const audioUrl = await textToSpeechUrl({
          text: aiResponse.response,
          voiceId: ttsVoiceId,
        });

        console.log("TTS Audio URL created:", audioUrl);

        // 音声を再生
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        // 音量を確認（デフォルトは1.0）
        audio.volume = 1.0;
        console.log("Audio volume set to:", audio.volume);

        console.log("Audio element created, waiting for playback...");

        try {
          await audio.play();
          console.log("Audio playback started successfully");
        } catch (err) {
          console.error("Audio playback failed (autoplay?)", err);
          setState((prev) => ({
            ...prev,
            error: new Error(
              "Audio playback failed. Please interact with the page (e.g., click somewhere) and try again."
            ),
          }));
        }

        setState((prev) => ({
          ...prev,
          currentAudioUrl: audioUrl,
          isProcessing: false,
        }));

        onAudioReady?.(audioUrl);

        return aiResponse.assistantMessage;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        console.error("Conversation error:", err);
        setState((prev) => ({
          ...prev,
          error: err,
          isProcessing: false,
        }));
        return null;
      }
    },
    [state.session, systemPrompt, ttsVoiceId, onAudioReady, onEmotionUpdate]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    session: state.session,
    messages: state.messages,
    isProcessing: state.isProcessing,
    error: state.error,
    currentAudioUrl: state.currentAudioUrl,
    startSession,
    endSession,
    sendAudio,
  };
}
