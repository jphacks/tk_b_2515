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

export async function speechToText(
	apiKey: string,
	audioFile: Blob | File,
): Promise<string> {
	const client = getElevenLabsClient(apiKey);

	// Convert File to Buffer for ElevenLabs API
	const arrayBuffer = await audioFile.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const result = await client.speechToText.convert({
		file: buffer,
		modelId: "eleven_multilingual_v2",
	});

	// Handle different response types
	if ("text" in result) {
		return result.text || "";
	}
	if ("transcription" in result && typeof result.transcription === "string") {
		return result.transcription;
	}
	return "";
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
	modelId = "eleven_multilingual_v2",
): Promise<ReadableStream> {
	const client = getElevenLabsClient(apiKey);

	const audioStream = await client.textToSpeech.convert(voiceId, {
		text,
		modelId,
	});

	return audioStream as ReadableStream;
}
