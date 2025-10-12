import { GoogleGenAI } from "@google/genai";

let geminiClient: GoogleGenAI | null = null;

/**
 * Google Gemini AIクライアントを初期化して取得します
 * シングルトンパターンでクライアントを管理します
 * @param apiKey Google AI API キー
 * @returns 初期化されたGoogleGenAIインスタンス
 */
export function getGeminiClient(apiKey: string): GoogleGenAI {
	if (!geminiClient) {
		geminiClient = new GoogleGenAI({ apiKey });
	}
	return geminiClient;
}

/**
 * クライアントインスタンスをリセットします
 * テスト時やAPIキー変更時に使用します
 */
export function resetGeminiClient(): void {
	geminiClient = null;
}
