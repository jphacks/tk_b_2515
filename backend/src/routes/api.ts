import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { prisma } from "../lib/prisma";
import {
  getVoiceById,
  getVoices,
  speechToText,
  speechToTextWithVoice,
  textToSpeech,
} from "../services/stt";
import {
  generateConversationResponse,
  generateConversationFeedback,
} from "../services/conversation";

const api = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

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
        400
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

api.openapi(getVoicesRoute, (async (c: any) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key not configured" }, 500);
    }

    const voices = await getVoices(apiKey);
    return c.json({ voices }, 200);
  } catch (error) {
    console.error("Error fetching voices:", error);
    return c.json({ error: "Failed to fetch voices" }, 500);
  }
}) as any);

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
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "API key not configured" }, 500);
    }

    const { voiceId } = c.req.valid("param");
    const voice = await getVoiceById(apiKey, voiceId);

    if (!voice) {
      return c.json({ error: "Voice not found" }, 404);
    }

    return c.json({ voice }, 200);
  } catch (error) {
    console.error("Error fetching voice:", error);
    return c.json({ error: "Failed to fetch voice" }, 500);
  }
});

// Speech-to-text エンドポイント
api.post("/stt", async (c) => {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error("STT Error: ELEVENLABS_API_KEY is not configured");
      return c.json({ error: "API key not configured" }, 500);
    }

    const body = await c.req.parseBody();
    const audioFile = body.audio;
    const voiceId = body.voiceId as string | undefined;

    console.log("STT Request received:", {
      hasAudio: !!audioFile,
      audioType: audioFile instanceof File ? audioFile.type : typeof audioFile,
      audioSize: audioFile instanceof File ? audioFile.size : 0,
      voiceId: voiceId || "none",
    });

    if (!audioFile || !(audioFile instanceof File)) {
      console.error("STT Error: Invalid audio file", {
        audioFile: typeof audioFile,
      });
      return c.json({ error: "Audio file is required" }, 400);
    }

    if (voiceId) {
      // voiceIdが指定されている場合は音声情報も取得
      console.log("Calling speechToTextWithVoice with voiceId:", voiceId);
      const result = await speechToTextWithVoice(apiKey, audioFile, voiceId);
      console.log("STT Success:", {
        textLength: result.text.length,
        hasVoice: !!result.voice,
      });
      return c.json(result);
    }
    // voiceIdなしの場合は単純にSTT
    console.log("Calling speechToText without voiceId");
    const text = await speechToText(apiKey, audioFile);
    console.log("STT Success:", { textLength: text.length });
    return c.json({ text });
  } catch (error) {
    // より詳細なエラー情報をログ出力
    console.error("Error in STT - Full details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });

    // エラーメッセージをクライアントに返す（開発環境では詳細を、本番では一般的なメッセージを）
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return c.json(
      {
        error: "Failed to process speech-to-text",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      500
    );
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
    const apiKey = process.env.ELEVENLABS_API_KEY;
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

// === AI Conversation Endpoints ===

// 会話応答を生成 with OpenAPI
const generateResponseRoute = createRoute({
  method: "post",
  path: "/conversation/generate",
  tags: ["Conversation"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({
              description: "会話セッションID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            }),
            userMessage: z.string().openapi({
              description: "ユーザーのメッセージ",
              example: "こんにちは！今日はいい天気ですね。",
            }),
            systemPrompt: z.string().optional().openapi({
              description: "システムプロンプト（オプション）",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "AIによる応答",
      content: {
        "application/json": {
          schema: z.object({
            response: z.string(),
            userMessage: z.object({
              id: z.string(),
              role: z.string(),
              content: z.string(),
              createdAt: z.string(),
            }),
            assistantMessage: z.object({
              id: z.string(),
              role: z.string(),
              content: z.string(),
              createdAt: z.string(),
            }),
          }),
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
    404: {
      description: "Session not found",
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

api.openapi(generateResponseRoute, async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Gemini API key not configured" }, 500);
    }

    const { sessionId, userMessage, systemPrompt } = c.req.valid("json");

    // セッションの存在確認
    const session = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // ユーザーメッセージを保存
    const savedUserMessage = await prisma.message.create({
      data: {
        role: "user",
        content: userMessage,
        conversationId: sessionId,
      },
    });

    // 会話履歴を構築
    const conversationHistory = [
      ...session.messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];

    // AI応答を生成
    const aiResponse = await generateConversationResponse(apiKey, {
      messages: conversationHistory,
      systemPrompt,
    });

    // AI応答を保存
    const savedAssistantMessage = await prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse,
        conversationId: sessionId,
      },
    });

    return c.json(
      {
        response: aiResponse,
        userMessage: savedUserMessage,
        assistantMessage: savedAssistantMessage,
      },
      200
    );
  } catch (error) {
    console.error("Error generating conversation response:", error);
    return c.json({ error: "Failed to generate conversation response" }, 500);
  }
});

// 会話フィードバックを生成 with OpenAPI
const generateFeedbackRoute = createRoute({
  method: "post",
  path: "/conversation/feedback",
  tags: ["Conversation"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string().openapi({
              description: "会話セッションID",
              example: "123e4567-e89b-12d3-a456-426614174000",
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "会話のフィードバック",
      content: {
        "application/json": {
          schema: z.object({
            feedback: z.object({
              id: z.string(),
              goodPoints: z.string(),
              improvementPoints: z.string(),
              overallScore: z.number().nullable(),
              createdAt: z.string(),
            }),
          }),
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
    404: {
      description: "Session not found",
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

api.openapi(generateFeedbackRoute, async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Gemini API key not configured" }, 500);
    }

    const { sessionId } = c.req.valid("json");

    // セッションとメッセージを取得
    const session = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (session.messages.length === 0) {
      return c.json({ error: "No messages found in this session" }, 400);
    }

    // 会話履歴を構築
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // フィードバックを生成
    const feedbackData = await generateConversationFeedback(
      apiKey,
      conversationHistory
    );

    const goodPointsStr = Array.isArray(feedbackData.goodPoints)
      ? feedbackData.goodPoints.join("\n")
      : feedbackData.goodPoints;
    const improvementPointsStr = Array.isArray(feedbackData.improvementPoints)
      ? feedbackData.improvementPoints.join("\n")
      : feedbackData.improvementPoints;

    // フィードバックを保存（既存のフィードバックがあればupsert）
    const savedFeedback = await prisma.feedback.upsert({
      where: {
        conversationId: sessionId,
      },
      update: {
        goodPoints: goodPointsStr,
        improvementPoints: improvementPointsStr,
        overallScore: feedbackData.overallScore,
      },
      create: {
        goodPoints: goodPointsStr,
        improvementPoints: improvementPointsStr,
        overallScore: feedbackData.overallScore,
        conversationId: sessionId,
      },
    });

    return c.json({ feedback: savedFeedback }, 200);
  } catch (error) {
    console.error("Error generating feedback:", error);
    return c.json({ error: "Failed to generate feedback" }, 500);
  }
});

export default api;
