import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { prisma } from "../lib/prisma";
import {
	getVoiceById,
	getVoices,
	speechToText,
	speechToTextWithVoice,
	textToSpeech,
} from "../services/stt";

const api = new OpenAPIHono<{ Bindings: { ELEVENLABS_API_KEY: string } }>();

// Health check endpoint with OpenAPI
const healthRoute = createRoute({
	method: "get",
	path: "/health",
	tags: ["Health"],
	responses: {
		200: {
			description: "API is healthy",
			content: {
				"application/json": {
					schema: z.object({
						status: z.string().openapi({ example: "ok" }),
					}),
				},
			},
		},
	},
});

api.openapi(healthRoute, (c) => {
	return c.json({ status: "ok" });
});

// === Conversation Session Endpoints ===

// 新しいセッションを作成
api.post("/sessions", async (c) => {
	try {
		const session = await prisma.conversation.create({
			data: {},
		});
		return c.json({ session }, 201);
	} catch (error) {
		console.error("Error creating session:", error);
		return c.json({ error: "Failed to create session" }, 500);
	}
});

// すべてのセッションを取得
api.get("/sessions", async (c) => {
	try {
		const sessions = await prisma.conversation.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				messages: true,
				feedback: true,
			},
		});
		return c.json({ sessions });
	} catch (error) {
		console.error("Error fetching sessions:", error);
		return c.json({ error: "Failed to fetch sessions" }, 500);
	}
});

// 特定のセッションを取得
api.get("/sessions/:sessionId", async (c) => {
	try {
		const sessionId = c.req.param("sessionId");
		const session = await prisma.conversation.findUnique({
			where: { id: sessionId },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
				},
				feedback: true,
			},
		});

		if (!session) {
			return c.json({ error: "Session not found" }, 404);
		}

		return c.json({ session });
	} catch (error) {
		console.error("Error fetching session:", error);
		return c.json({ error: "Failed to fetch session" }, 500);
	}
});

// セッションを終了
api.patch("/sessions/:sessionId/finish", async (c) => {
	try {
		const sessionId = c.req.param("sessionId");
		const session = await prisma.conversation.update({
			where: { id: sessionId },
			data: {
				status: "completed",
				updatedAt: new Date(),
			},
		});
		return c.json({ session });
	} catch (error) {
		console.error("Error finishing session:", error);
		return c.json({ error: "Failed to finish session" }, 500);
	}
});

// === Message Endpoints ===

// セッションにメッセージを追加
api.post("/sessions/:sessionId/messages", async (c) => {
	try {
		const sessionId = c.req.param("sessionId");
		const body = await c.req.json();
		const { role, content, audioUrl } = body;

		if (!role || !content) {
			return c.json({ error: "role and content are required" }, 400);
		}

		if (role !== "user" && role !== "assistant") {
			return c.json({ error: "role must be user or assistant" }, 400);
		}

		const message = await prisma.message.create({
			data: {
				role,
				content,
				audioUrl: audioUrl || null,
				conversationId: sessionId,
			},
		});

		return c.json({ message }, 201);
	} catch (error) {
		console.error("Error creating message:", error);
		return c.json({ error: "Failed to create message" }, 500);
	}
});

// === Feedback Endpoints ===

// セッションにフィードバックを追加
api.post("/sessions/:sessionId/feedback", async (c) => {
	try {
		const sessionId = c.req.param("sessionId");
		const body = await c.req.json();
		const { goodPoints, improvementPoints, overallScore } = body;

		if (!goodPoints || !improvementPoints) {
			return c.json(
				{ error: "goodPoints and improvementPoints are required" },
				400,
			);
		}

		const feedback = await prisma.feedback.create({
			data: {
				goodPoints,
				improvementPoints,
				overallScore: overallScore || null,
				conversationId: sessionId,
			},
		});

		return c.json({ feedback }, 201);
	} catch (error) {
		console.error("Error creating feedback:", error);
		return c.json({ error: "Failed to create feedback" }, 500);
	}
});

// 利用可能な音声一覧を取得 with OpenAPI
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
						voices: z.array(z.any()),
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

api.openapi(getVoicesRoute, async (c) => {
	try {
		const apiKey = c.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const voices = await getVoices(apiKey);
		return c.json({ voices });
	} catch (error) {
		console.error("Error fetching voices:", error);
		return c.json({ error: "Failed to fetch voices" }, 500);
	}
});

// 特定の音声情報を取得 with OpenAPI
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

api.openapi(getVoiceByIdRoute, async (c) => {
	try {
		const apiKey = c.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const { voiceId } = c.req.valid("param");
		const voice = await getVoiceById(apiKey, voiceId);

		if (!voice) {
			return c.json({ error: "Voice not found" }, 404);
		}

		return c.json({ voice });
	} catch (error) {
		console.error("Error fetching voice:", error);
		return c.json({ error: "Failed to fetch voice" }, 500);
	}
});

// Speech-to-text エンドポイント
api.post("/stt", async (c) => {
	try {
		const apiKey = c.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const body = await c.req.parseBody();
		const audioFile = body.audio;
		const voiceId = body.voiceId as string | undefined;

		if (!audioFile || !(audioFile instanceof File)) {
			return c.json({ error: "Audio file is required" }, 400);
		}

		if (voiceId) {
			// voiceIdが指定されている場合は音声情報も取得
			const result = await speechToTextWithVoice(apiKey, audioFile, voiceId);
			return c.json(result);
		}
		// voiceIdなしの場合は単純にSTT
		const text = await speechToText(apiKey, audioFile);
		return c.json({ text });
	} catch (error) {
		console.error("Error in STT:", error);
		return c.json({ error: "Failed to process speech-to-text" }, 500);
	}
});

// Text-to-speech エンドポイント with OpenAPI
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
						voiceId: z.string().openapi({
							description: "Voice ID to use for synthesis",
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

api.openapi(ttsRoute, async (c) => {
	try {
		const apiKey = c.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const { text, voiceId, modelId } = c.req.valid("json");

		const audioStream = await textToSpeech(apiKey, text, voiceId, modelId);

		// Set appropriate headers for audio streaming
		c.header("Content-Type", "audio/mpeg");
		c.header("Transfer-Encoding", "chunked");

		return c.body(audioStream);
	} catch (error) {
		console.error("Error in TTS:", error);
		return c.json({ error: "Failed to process text-to-speech" }, 500);
	}
});

// Speech-to-text エンドポイント (keeping as regular endpoint for now due to file upload complexity)
api.post("/stt", async (c) => {
	try {
		const apiKey = c.env.ELEVENLABS_API_KEY;
		if (!apiKey) {
			return c.json({ error: "API key not configured" }, 500);
		}

		const body = await c.req.parseBody();
		const audioFile = body.audio;
		const voiceId = body.voiceId as string | undefined;

		if (!audioFile || !(audioFile instanceof File)) {
			return c.json({ error: "Audio file is required" }, 400);
		}

		if (voiceId) {
			// voiceIdが指定されている場合は音声情報も取得
			const result = await speechToTextWithVoice(apiKey, audioFile, voiceId);
			return c.json(result);
		}
		// voiceIdなしの場合は単純にSTT
		const text = await speechToText(apiKey, audioFile);
		return c.json({ text });
	} catch (error) {
		console.error("Error in STT:", error);
		return c.json({ error: "Failed to process speech-to-text" }, 500);
	}
});

export default api;
