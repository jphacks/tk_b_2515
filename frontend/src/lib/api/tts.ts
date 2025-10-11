import { config } from "../config";

/**
 * Text-to-Speech API
 */

export interface TextToSpeechRequest {
	text: string;
	voiceId: string;
	modelId?: string;
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
 * テキストを音声に変換して、Audio要素で再生可能なURLを返す
 */
export async function textToSpeechUrl(
	request: TextToSpeechRequest,
): Promise<string> {
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
	const blob = new Blob(chunks, { type: "audio/mpeg" });
	return URL.createObjectURL(blob);
}
