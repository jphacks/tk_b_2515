/**
 * APIクライアント
 * バックエンドAPIとの通信を行う関数をエクスポート
 */

// クライアント
export { apiClient } from "./client";

// 音声関連API
export { checkHealth, getVoices, getVoiceById } from "./voices";

// Speech-to-Text API
export { speechToText } from "./speech";
