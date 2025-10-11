import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type * as ElevenLabs from "@elevenlabs/elevenlabs-js/api";

export interface VoiceSettings {
	stability?: number;
	similarity_boost?: number;
}

export interface Voice {
	voiceId: string;
	name: string;
	category: string;
	description?: string;
	labels?: Record<string, string>;
	samples?: Array<{
		sampleId?: string;
		fileName?: string;
		mimeType?: string;
	}>;
	settings?: VoiceSettings;
}

export async function getVoices(apiKey: string): Promise<Voice[]> {
	const client = new ElevenLabsClient({
		apiKey,
	});

	const voices = await client.voices.getAll();
	// Map the API response to our interface
	return voices.voices.map((v: ElevenLabs.Voice) => ({
		voiceId: v.voiceId,
		name: v.name || "",
		category: v.category || "",
		description: v.description,
		labels: v.labels,
		samples: v.samples?.map((s: ElevenLabs.VoiceSample) => ({
			sampleId: s.sampleId,
			fileName: s.fileName,
			mimeType: s.mimeType,
		})),
		settings: v.settings
			? {
					stability: v.settings.stability,
					similarity_boost: v.settings.similarityBoost,
				}
			: undefined,
	}));
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
	audioFile: File,
): Promise<string> {
	const client = new ElevenLabsClient({
		apiKey,
	});

	const result = await client.speechToText.convert({
		file: audioFile,
		modelId: "scribe_v1",
	});

	// The result can be one of three types, but all have text property
	if ("text" in result) {
		return result.text;
	}

	return "";
}

export async function speechToTextWithVoice(
	apiKey: string,
	audioFile: File,
	voiceId: string,
): Promise<{ text: string; voice: Voice | null }> {
	const [text, voice] = await Promise.all([
		speechToText(apiKey, audioFile),
		getVoiceById(apiKey, voiceId),
	]);

	return { text, voice };
}
