import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export interface VoiceSettings {
	stability: number;
	similarity_boost: number;
}

export interface Voice {
	voice_id: string;
	name: string;
	category: string;
	description: string;
	labels: Record<string, string>;
	samples: Array<{
		sample_id: string;
		file_name: string;
		mime_type: string;
	}>;
	settings: VoiceSettings;
}

export async function getVoices(apiKey: string): Promise<Voice[]> {
	const client = new ElevenLabsClient({
		apiKey,
	});

	const voices = await client.voices.getAll();
	return voices.voices as Voice[];
}

export async function getVoiceById(
	apiKey: string,
	voiceId: string,
): Promise<Voice | null> {
	const voices = await getVoices(apiKey);
	return voices.find((v) => v.voice_id === voiceId) || null;
}

export async function speechToText(
	apiKey: string,
	audioFile: Blob | File,
): Promise<string> {
	const client = new ElevenLabsClient({
		apiKey,
	});

	const result = await client.speechToText.convert({
		audio: audioFile,
	});

	return result.text;
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
