import { GoogleGenerativeAI } from "@google/genai";

let geminiClient: GoogleGenerativeAI | null = null;

/**
 * Google Gemini AIクライアントを初期化して取得します
 * シングルトンパターンでクライアントを管理します
 * @param apiKey Google AI API キー
 * @returns 初期化されたGoogleGenerativeAIインスタンス
 */
export function getGeminiClient(apiKey: string): GoogleGenerativeAI {
	if (!geminiClient) {
		geminiClient = new GoogleGenerativeAI(apiKey);
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
