import type { Voice } from "@elevenlabs/elevenlabs-js/api";
import { getElevenLabsClient } from "./client";

export async function getVoices(apiKey: string): Promise<Voice[]> {
  const client = getElevenLabsClient(apiKey);

  const voices = await client.voices.getAll();
  return voices.voices;
}

export async function getVoiceById(
  apiKey: string,
  voiceId: string
): Promise<Voice | null> {
  const voices = await getVoices(apiKey);
  return voices.find((v) => v.voiceId === voiceId) || null;
}

export async function speechToText(
  apiKey: string,
  audioFile: Blob | File
): Promise<string> {
  try {
    const client = getElevenLabsClient(apiKey);
    // console.log(apiKey);

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
    if ("text" in result) {
      return result.text || "";
    }
    if ("transcription" in result && typeof result.transcription === "string") {
      return result.transcription;
    }

    console.warn("Unexpected STT result format:", result);
    return "";
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
  voiceId: string
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
  modelId = "Eleven v3"
): Promise<ReadableStream> {
  const client = getElevenLabsClient(apiKey);

  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId,
  });

  return audioStream as ReadableStream;
}
