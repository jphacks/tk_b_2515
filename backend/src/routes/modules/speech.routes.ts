import type { Voice } from "@elevenlabs/elevenlabs-js/api";
import { createRoute, z } from "@hono/zod-openapi";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { Context } from "hono";
import {
	getVoiceById,
	getVoices,
	speechToText,
	speechToTextWithVoice,
	textToSpeech,
} from "../../services/stt";
import { createApiRoute } from "../utils";

const speech = createApiRoute();

// Voice schema for OpenAPI documentation
const voiceSchema = z.object({
	voiceId: z.string(),
	name: z.string().optional(),
	category: z.string().optional(),
	description: z.string().optional(),
	labels: z.record(z.string(), z.string()).optional(),
	previewUrl: z.string().optional(),
	availableForTiers: z.array(z.string()).optional(),
	settings: z.any().optional(),
	sharing: z.any().optional(),
	highQualityBaseModelIds: z.array(z.string()).optional(),
	safetyControl: z.string().optional(),
	voiceVerification: z.any().optional(),
	isLegacy: z.boolean().optional(),
	isOwner: z.boolean().optional(),
	fineTuning: z.any().optional(),
	createdAtUnix: z.number().optional(),
});

const serializeVoice = (voice: Voice) => {
	const {
		voiceId,
		name,
		category,
		description,
		labels,
		previewUrl,
		availableForTiers,
		settings,
		sharing,
		highQualityBaseModelIds,
		safetyControl,
		voiceVerification,
		isLegacy,
		isOwner,
		fineTuning,
		createdAtUnix,
	} = voice;

	return {
		voiceId,
		name,
		category,
		description,
		labels,
		previewUrl,
		availableForTiers,
		settings,
		sharing,
		highQualityBaseModelIds,
		safetyControl,
		voiceVerification,
		isLegacy,
		isOwner,
		fineTuning,
		createdAtUnix,
	};
};

// Get available voices
const getVoicesRoute = createRoute({
	method: "get",
	path: "/voices",
	tags: ["Voices"],
	responses: {
		200: {
			description: "List of available voices",
			content: {
				"application/json": {
					schema: z.object({
						voices: z.array(voiceSchema),
					}),
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

speech.openapi(getVoicesRoute, async (c) => {
	try {
		const apiKey = process.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const voices = await getVoices(apiKey);
		return c.json({ voices: voices.map(serializeVoice) }, 200);
	} catch (error) {
		console.error("Failed to fetch voices:", error);
		return c.json({ error: "Failed to fetch voices" }, 500);
	}
});

// Get specific voice by ID
const getVoiceByIdRoute = createRoute({
	method: "get",
	path: "/voices/{voiceId}",
	tags: ["Voices"],
	request: {
		params: z.object({
			voiceId: z.string().openapi({
				description: "Voice ID",
				example: "21m00Tcm4TlvDq8ikWAM",
			}),
		}),
	},
	responses: {
		200: {
			description: "Voice details",
			content: {
				"application/json": {
					schema: z.object({
						voice: z.any(),
					}),
				},
			},
		},
		404: {
			description: "Voice not found",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

speech.openapi(getVoiceByIdRoute, async (c) => {
	try {
		const apiKey = process.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const { voiceId } = c.req.valid("param");
		const voice = await getVoiceById(apiKey, voiceId);

		if (!voice) {
			return c.json({ error: "Voice not found" }, 404);
		}

		return c.json({ voice: serializeVoice(voice) }, 200);
	} catch (error) {
		console.error("Failed to fetch voice:", error);
		return c.json({ error: "Failed to fetch voice" }, 500);
	}
});

type FileLike = Blob & { arrayBuffer: () => Promise<ArrayBuffer> };

const isFileLike = (value: unknown): value is FileLike => {
	return (
		typeof value === "object" &&
		value !== null &&
		"arrayBuffer" in (value as Record<string, unknown>) &&
		typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function"
	);
};

// Speech-to-text endpoint
// 統一されたエラー応答ヘルパー
function sttError(
	c: Context,
	status: ContentfulStatusCode,
	code: string,
	message: string,
	details?: string,
) {
	return c.json(
		{
			error: message,
			code,
			details: process.env.NODE_ENV === "development" ? details : undefined,
		},
		status,
	);
}

speech.post("/stt", async (c) => {
	try {
		const apiKey = process.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			console.error("STT Error: ELEVENLABS_API_KEY is not configured");
			return sttError(
				c,
				500,
				"API_KEY_NOT_CONFIGURED",
				"API key not configured",
			);
		}

		let audioFile: FileLike | undefined;
		let voiceId: string | undefined;

		// まずFormDataとしての解析を試みる（multipart対応）
		try {
			const formData = await c.req.formData();
			const audioEntry = formData.get("audio");
			// Node環境ではFile型が無いことがあるため duck-typing で判定
			if (audioEntry && isFileLike(audioEntry)) {
				audioFile = audioEntry;
			}
			const voiceIdEntry = formData.get("voiceId");
			if (typeof voiceIdEntry === "string") {
				voiceId = voiceIdEntry;
			}
		} catch (formErr) {
			console.warn("FormData parse failed, fallback to parseBody", formErr);
			try {
				const body = (await c.req.parseBody()) as Record<string, unknown>;
				const potentialAudio = body?.audio;
				if (isFileLike(potentialAudio)) {
					audioFile = potentialAudio;
				}
				if (typeof body?.voiceId === "string") {
					voiceId = body.voiceId;
				}
			} catch (bodyErr) {
				console.error("Both FormData and parseBody failed", bodyErr);
				return sttError(
					c,
					400,
					"BODY_PARSE_FAILED",
					"Failed to parse request body",
					bodyErr instanceof Error ? bodyErr.message : String(bodyErr),
				);
			}
		}

		console.log("STT Request received:", {
			hasAudio: !!audioFile,
			audioType: audioFile?.type,
			audioSize: audioFile?.size,
			voiceId: voiceId || "none",
		});

		if (!audioFile) {
			return sttError(c, 400, "AUDIO_FILE_MISSING", "Audio file is required");
		}

		if (voiceId) {
			console.log("Calling speechToTextWithVoice with voiceId:", voiceId);
			const result = await speechToTextWithVoice(apiKey, audioFile, voiceId);
			console.log("STT Success:", {
				textLength: result.text.length,
				hasVoice: !!result.voice,
			});
			if (result.text === "[UNSUPPORTED_LANGUAGE]") {
				return sttError(
					c,
					422,
					"UNSUPPORTED_LANGUAGE",
					"日本語か英語で話してください。",
					"Detected unsupported language",
				);
			}
			return c.json(result);
		}

		console.log("Calling speechToText without voiceId");
		const text = await speechToText(apiKey, audioFile);
		console.log("STT Success:", { textLength: text.length });
		if (text === "[UNSUPPORTED_LANGUAGE]") {
			return sttError(
				c,
				422,
				"UNSUPPORTED_LANGUAGE",
				"日本語か英語で話してください。",
				"Detected unsupported language",
			);
		}
		return c.json({ text });
	} catch (error) {
		console.error("Error in STT - Full details:", {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			type: error instanceof Error ? error.constructor.name : typeof error,
		});
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return sttError(
			c,
			500,
			"STT_INTERNAL_ERROR",
			"Failed to process speech-to-text",
			errorMessage,
		);
	}
});

// Text-to-speech endpoint
const ttsRoute = createRoute({
	method: "post",
	path: "/tts",
	tags: ["Speech"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						text: z.string().openapi({
							description: "Text to convert to speech",
							example: "こんにちは、これはテストです",
						}),
						voiceId: z.string().optional().openapi({
							description:
								"Voice ID to use for synthesis (optional, uses default if not provided)",
							example: "21m00Tcm4TlvDq8ikWAM",
						}),
						modelId: z.string().optional().openapi({
							description:
								"Model ID (optional, defaults to eleven_multilingual_v2)",
							example: "eleven_multilingual_v2",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Audio stream",
			content: {
				"audio/mpeg": {
					schema: z.any(),
				},
			},
		},
		400: {
			description: "Bad request",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
		500: {
			description: "Internal server error",
			content: {
				"application/json": {
					schema: z.object({
						error: z.string(),
					}),
				},
			},
		},
	},
});

speech.openapi(ttsRoute, async (c) => {
	try {
		const apiKey = process.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const { text, voiceId, modelId } = c.req.valid("json");

		// Use default voiceId if not provided (Rachel - a natural sounding voice)
		const selectedVoiceId = voiceId || "lhTvHflPVOqgSWyuWQry";

		const audioStream = await textToSpeech(
			apiKey,
			text,
			selectedVoiceId,
			modelId,
		);

		// Set appropriate headers for audio streaming
		c.header("Content-Type", "audio/mpeg");
		c.header("Transfer-Encoding", "chunked");

		return c.body(audioStream);
	} catch (error) {
		console.error("Failed to process text-to-speech:", error);
		return c.json({ error: "Failed to process text-to-speech" }, 500);
	}
});

export default speech;
