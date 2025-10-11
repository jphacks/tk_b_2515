/**
 * APIクライアント
 * バックエンドAPIとの通信を行う関数をエクスポート
 */

// クライアント
export { apiClient } from "./client";
// Speech-to-Text API
export { speechToText } from "./speech";
// Text-to-Speech API
export { textToSpeech, textToSpeechUrl } from "./tts";
// 音声関連API
export { checkHealth, getVoiceById, getVoices } from "./voices";
// 会話セッション関連API
export { sessionApi, messageApi, conversationApi } from "./conversation";
// フィードバック関連API
export { feedbackApi } from "./feedback";
