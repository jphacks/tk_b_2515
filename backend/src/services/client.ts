import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

let elevenLabsClient: ElevenLabsClient | null = null;

/**
 * ElevenLabsクライアントを初期化して取得します
 * シングルトンパターンでクライアントを管理します
 * @param apiKey ElevenLabs API キー
 * @returns 初期化されたElevenLabsClientインスタンス
 */
export function getElevenLabsClient(apiKey: string): ElevenLabsClient {
	if (!elevenLabsClient) {
		elevenLabsClient = new ElevenLabsClient({
			apiKey,
		});
	}
	return elevenLabsClient;
}

/**
 * クライアントインスタンスをリセットします
 * テスト時やAPIキー変更時に使用します
 */
export function resetElevenLabsClient(): void {
	elevenLabsClient = null;
}
