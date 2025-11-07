import type { Voice } from "@elevenlabs/elevenlabs-js/api";
import { getElevenLabsClient } from "./client";

export async function getVoices(apiKey: string): Promise<Voice[]> {
	const client = getElevenLabsClient(apiKey);

	const voices = await client.voices.getAll();
	return voices.voices;
}

export async function getVoiceById(
	apiKey: string,
	voiceId: string,
): Promise<Voice | null> {
	const voices = await getVoices(apiKey);
	return voices.find((v) => v.voiceId === voiceId) || null;
}

/**
 * 日本語と英語以外の文字が含まれているかチェック
 */
function containsUnsupportedLanguage(text: string): boolean {
	// 日本語（ひらがな、カタカナ、漢字）、英語（ASCII）、数字、一般的な記号を除外
	const allowedPattern =
		/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\uFF00-\uFFEFa-zA-Z0-9\s.,!?、。！？\-_()（）「」『』【】\n\r]*$/;

	// パターンにマッチしない = 許可されていない文字が含まれている
	return !allowedPattern.test(text);
}

export async function speechToText(
	apiKey: string,
	audioFile: Blob | File,
): Promise<string> {
	try {
		const client = getElevenLabsClient(apiKey);

		console.log("Converting audio to buffer...", {
			size: audioFile.size,
			type: audioFile.type,
		});

		// Convert File to Buffer for ElevenLabs API
		const arrayBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		console.log("Calling ElevenLabs speechToText.convert...", {
			bufferSize: buffer.length,
		});

		const result = await client.speechToText.convert({
			file: buffer,
			modelId: "scribe_v1",
		});

		console.log("ElevenLabs API response:", { result });

		// Handle different response types
		let transcribedText = "";
		if ("text" in result) {
			transcribedText = result.text || "";
		} else if (
			"transcription" in result &&
			typeof result.transcription === "string"
		) {
			transcribedText = result.transcription;
		} else {
			console.warn("Unexpected STT result format:", result);
			return "";
		}

		// 日本語と英語以外の言語チェック
		if (containsUnsupportedLanguage(transcribedText)) {
			console.warn(
				"Detected unsupported language in transcription:",
				transcribedText,
			);
			// エラーではなく、ユーザーに日本語か英語で話すよう促すプレースホルダーテキストを返す
			return "[UNSUPPORTED_LANGUAGE]";
		}

		return transcribedText;
	} catch (error) {
		console.error("Error in speechToText service:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			type: error instanceof Error ? error.constructor.name : typeof error,
		});
		throw error;
	}
}

export async function speechToTextWithVoice(
	apiKey: string,
	audioFile: Blob | File,
	voiceId: string,
): Promise<{ text: string; voice: Voice | null }> {
	const [text, voice] = await Promise.all([
		speechToText(apiKey, audioFile),
		getVoiceById(apiKey, voiceId),
	]);

	return { text, voice };
}

export async function textToSpeech(
	apiKey: string,
	text: string,
	voiceId: string,
	modelId = "Eleven v3",
): Promise<ReadableStream> {
	const client = getElevenLabsClient(apiKey);

	const audioStream = await client.textToSpeech.convert(voiceId, {
		text,
		modelId,
	});

	return audioStream as ReadableStream;
}
