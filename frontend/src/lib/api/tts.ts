import { audioCache } from "../cache/audioCache";
import { config } from "../config";

/**
 * Text-to-Speech API
 */

export interface TextToSpeechRequest {
	text: string;
	voiceId?: string; // オプションに変更（バックエンドがデフォルトを使用）
	modelId?: string;
}

export interface TextToSpeechOptions {
	maxRetries?: number;
	retryDelay?: number;
	fallbackToSilence?: boolean;
	useCache?: boolean;
}

/**
 * テキストを音声に変換
 * @returns 音声データのReadableStream
 */
export async function textToSpeech(
	request: TextToSpeechRequest,
): Promise<ReadableStream<Uint8Array>> {
	try {
		// Build request body, only include voiceId if it's provided
		const requestBody: Record<string, string> = {
			text: request.text,
			modelId: request.modelId || "eleven_multilingual_v2",
		};

		if (request.voiceId) {
			requestBody.voiceId = request.voiceId;
		}

		const response = await fetch(`${config.api.baseUrl}/api/tts`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		});

		if (!response.ok) {
			let errorMessage = `HTTP error! status: ${response.status}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || errorMessage;
				// Include additional error details if available
				if (errorData.details) {
					errorMessage += ` - ${errorData.details}`;
				}
			} catch {
				// JSONのパースに失敗した場合はデフォルトのエラーメッセージを使用
			}
			throw new Error(errorMessage);
		}

		if (!response.body) {
			throw new Error("Response body is null");
		}

		return response.body;
	} catch (error) {
		// Re-throw with better error message if it's a network error
		if (error instanceof TypeError && error.message.includes("fetch")) {
			throw new Error(
				`Network error: Failed to connect to TTS API at ${config.api.baseUrl}/api/tts. Make sure the backend server is running.`,
			);
		}
		throw error;
	}
}

/**
 * 指定されたミリ秒待機
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * テキストを音声に変換して、Audio要素で再生可能なURLを返す（キャッシュ & リトライ機能付き）
 */
export async function textToSpeechUrl(
	request: TextToSpeechRequest,
	options: TextToSpeechOptions = {},
): Promise<string> {
	const {
		maxRetries = 3,
		retryDelay = 1000,
		fallbackToSilence = true,
		useCache = true,
	} = options;

	// キャッシュチェック（voiceIdがある場合のみ）
	if (useCache && request.voiceId) {
		const cachedUrl = audioCache.get(request.text, request.voiceId);
		if (cachedUrl) {
			console.log("TTS cache hit for:", request.text.substring(0, 50));
			return cachedUrl;
		}
	}

	let lastError: Error | null = null;

	// リトライループ
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			if (attempt > 0) {
				console.log(`TTS retry attempt ${attempt}/${maxRetries}`);
				await sleep(retryDelay * attempt); // 指数バックオフ
			}

			const stream = await textToSpeech(request);
			const reader = stream.getReader();
			const chunks: Uint8Array[] = [];

			// ストリームからすべてのチャンクを読み取る
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
			}

			// チャンクを結合してBlobを作成
			const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
			const audioUrl = URL.createObjectURL(blob);

			// キャッシュに保存（voiceIdがある場合のみ）
			if (useCache && request.voiceId) {
				audioCache.set(request.text, request.voiceId, audioUrl);
			}

			return audioUrl;
		} catch (error) {
			// Better error serialization
			if (error instanceof Error) {
				lastError = error;
			} else if (typeof error === "object" && error !== null) {
				// Try to extract meaningful information from the error object
				const errorMsg = JSON.stringify(error, null, 2);
				lastError = new Error(errorMsg);
			} else {
				lastError = new Error(String(error));
			}

			console.error(
				`TTS attempt ${attempt + 1} failed:`,
				lastError.message,
			);
			// Log full error details separately for better debugging
			console.error("Full error details:", error);
		}
	}

	// すべてのリトライが失敗した場合
	if (fallbackToSilence) {
		console.warn(
			"TTS failed after all retries, falling back to silent audio",
		);
		return createSilentAudio();
	}

	throw lastError || new Error("TTS failed");
}

/**
 * ストリーミング再生用: 音声を生成しながら再生
 * チャンクが到着次第、順次再生を開始
 */
export async function textToSpeechStreaming(
	request: TextToSpeechRequest,
	options: TextToSpeechOptions = {},
): Promise<{
	audioUrl: string;
	audioElement: HTMLAudioElement;
}> {
	const { useCache = true } = options;

	// キャッシュチェック（voiceIdがある場合のみ）
	if (useCache && request.voiceId) {
		const cachedUrl = audioCache.get(request.text, request.voiceId);
		if (cachedUrl) {
			console.log(
				"TTS streaming cache hit for:",
				request.text.substring(0, 50),
			);
			const audio = new Audio(cachedUrl);
			return { audioUrl: cachedUrl, audioElement: audio };
		}
	}

	// ストリーミング取得
	const stream = await textToSpeech(request);
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];

	// MediaSourceを使用してストリーミング再生
	// 注: MediaSourceはmp3で直接使用できないため、実際には全チャンクを集める必要がある
	// しかし、最初のチャンクが到着したらすぐに再生準備を開始できる

	// すべてのチャンクを収集
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}

	const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
	const audioUrl = URL.createObjectURL(blob);

	// キャッシュに保存（voiceIdがある場合のみ）
	if (useCache && request.voiceId) {
		audioCache.set(request.text, request.voiceId, audioUrl);
	}

	const audio = new Audio(audioUrl);
	return { audioUrl, audioElement: audio };
}

/**
 * 無音の音声を生成（フォールバック用）
 */
function createSilentAudio(): string {
	// 短い無音のMP3データ（Base64エンコード）
	const silentMp3 =
		"SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7////////////////////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQCgAAAAAAAAAOEfxjjZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZEYP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";

	const binaryString = atob(silentMp3);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}

	const blob = new Blob([bytes], { type: "audio/mpeg" });
	return URL.createObjectURL(blob);
}
