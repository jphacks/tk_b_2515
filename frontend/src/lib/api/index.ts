/**
 * APIクライアント
 * バックエンドAPIとの通信を行う関数をエクスポート
 */

// 音声キャッシュ
export { audioCache } from "../cache/audioCache";
// クライアント
export { apiClient } from "./client";
// 会話セッション関連API
export { conversationApi, messageApi, sessionApi } from "./conversation";
// フィードバック関連API
export { feedbackApi } from "./feedback";
// 仕草関連API
export { gestureApi } from "./gestures";
// Speech-to-Text API
export { speechToText } from "./speech";
export type { TextToSpeechOptions, TextToSpeechRequest } from "./tts";
// Text-to-Speech API (拡張機能: キャッシュ、リトライ、ストリーミング)
export { textToSpeech, textToSpeechStreaming, textToSpeechUrl } from "./tts";
// 音声関連API
export { checkHealth, getVoiceById, getVoices } from "./voices";
