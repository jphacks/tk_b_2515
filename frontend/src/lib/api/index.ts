/**
 * APIクライアント
 * バックエンドAPIとの通信を行う関数をエクスポート
 */

// クライアント
export { apiClient } from "./client";
// Speech-to-Text API
export { speechToText } from "./speech";
// 音声関連API
export { checkHealth, getVoiceById, getVoices } from "./voices";
