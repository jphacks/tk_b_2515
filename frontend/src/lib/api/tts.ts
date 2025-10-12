import { audioCache } from "../cache/audioCache";
import { config } from "../config";

/**
 * Text-to-Speech API
 */

export interface TextToSpeechRequest {
	text: string;
	voiceId: string;
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
	const response = await fetch(`${config.api.baseUrl}/api/tts`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			text: request.text,
			voiceId: request.voiceId,
			modelId: request.modelId || "eleven_multilingual_v2",
		}),
	});

	if (!response.ok) {
		let errorMessage = `HTTP error! status: ${response.status}`;
		try {
			const errorData = await response.json();
			errorMessage = errorData.error || errorMessage;
		} catch {
			// JSONのパースに失敗した場合はデフォルトのエラーメッセージを使用
		}
		throw new Error(errorMessage);
	}

	if (!response.body) {
		throw new Error("Response body is null");
	}

	return response.body;
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

	// キャッシュチェック
	if (useCache) {
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

			// キャッシュに保存
			if (useCache) {
				audioCache.set(request.text, request.voiceId, audioUrl);
			}

			return audioUrl;
		} catch (error) {
			lastError =
				error instanceof Error ? error : new Error("Unknown error");
			console.error(
				`TTS attempt ${attempt + 1} failed:`,
				lastError.message,
			);
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

	// キャッシュチェック
	if (useCache) {
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

	// キャッシュに保存
	if (useCache) {
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
