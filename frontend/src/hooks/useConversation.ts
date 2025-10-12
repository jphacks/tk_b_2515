import { useState, useCallback, useRef, useEffect } from "react";
import {
	sessionApi,
	conversationApi,
	speechToText,
	textToSpeechUrl,
} from "@/lib/api";
import type { ConversationSession, Message } from "@/types/api";
import { useLipSync } from "./useLipSync";

interface UseConversationOptions {
	voiceId: string;
	systemPrompt?: string;
	onAudioReady?: (audioUrl: string) => void;
	onLipSyncUpdate?: (value: number) => void;
}

interface ConversationState {
	session: ConversationSession | null;
	messages: Message[];
	isProcessing: boolean;
	error: Error | null;
	currentAudioUrl: string | null;
}

export function useConversation(options: UseConversationOptions) {
	const { voiceId, systemPrompt, onAudioReady, onLipSyncUpdate } = options;

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
			const session = await sessionApi.createSession();
			setState((prev) => ({
				...prev,
				session,
				isProcessing: false,
			}));
			return session;
		} catch (error) {
			const err =
				error instanceof Error ? error : new Error("Unknown error");
			setState((prev) => ({
				...prev,
				error: err,
				isProcessing: false,
			}));
			throw err;
		}
	}, []);

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
			const err =
				error instanceof Error ? error : new Error("Unknown error");
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
		async (audioBlob: Blob): Promise<Message | null> => {
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
					voiceId,
				});

				console.log("STT Result:", sttResult.text);

				// 2. AI: テキストから応答を生成
				const aiResponse = await conversationApi.generateResponse({
					sessionId: state.session.id,
					userMessage: sttResult.text,
					systemPrompt,
				});

				console.log("AI Response:", aiResponse.response);

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
				const audioUrl = await textToSpeechUrl({
					text: aiResponse.response,
					voiceId,
				});

				console.log("TTS Audio URL:", audioUrl);

				// 音声を再生
				const audio = new Audio(audioUrl);
				audioRef.current = audio;

				audio.onloadedmetadata = () => {
					audio.play().catch((err) => {
						console.error("Audio playback failed:", err);
						setState((prev) => ({
							...prev,
							error: new Error("Audio playback failed"),
						}));
					});
				};

				setState((prev) => ({
					...prev,
					currentAudioUrl: audioUrl,
					isProcessing: false,
				}));

				onAudioReady?.(audioUrl);

				return aiResponse.assistantMessage;
			} catch (error) {
				const err =
					error instanceof Error ? error : new Error("Unknown error");
				console.error("Conversation error:", err);
				setState((prev) => ({
					...prev,
					error: err,
					isProcessing: false,
				}));
				return null;
			}
		},
		[state.session, voiceId, systemPrompt, onAudioReady],
	);

	// クリーンアップ
	useEffect(() => {
		return () => {
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
			if (state.currentAudioUrl) {
				URL.revokeObjectURL(state.currentAudioUrl);
			}
		};
	}, [state.currentAudioUrl]);

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
