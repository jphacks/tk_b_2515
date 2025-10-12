/**
 * APIクライアント
 * バックエンドAPIとの通信を行う関数をエクスポート
 */

// クライアント
export { apiClient } from "./client";
// Speech-to-Text API
export { speechToText } from "./speech";
// Text-to-Speech API (拡張機能: キャッシュ、リトライ、ストリーミング)
export {
	textToSpeech,
	textToSpeechUrl,
	textToSpeechStreaming,
} from "./tts";
export type { TextToSpeechRequest, TextToSpeechOptions } from "./tts";
// 音声関連API
export { checkHealth, getVoiceById, getVoices } from "./voices";
// 会話セッション関連API
export { sessionApi, messageApi, conversationApi } from "./conversation";
// フィードバック関連API
export { feedbackApi } from "./feedback";
// 音声キャッシュ
export { audioCache } from "../cache/audioCache";
