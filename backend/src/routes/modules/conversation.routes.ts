import { createRoute, z } from "@hono/zod-openapi";
import type { Prisma, Feedback as PrismaFeedback } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  generateConversationFeedback,
  generateConversationResponse,
} from "../../services/conversation";
import { createApiRoute } from "../utils";

const conversation = createApiRoute();

// Generate AI conversation response
const generateResponseRoute = createRoute({
  method: "post",
  path: "/generate",
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
            emotion: z.enum([
              "neutral",
              "happy",
              "sad",
              "surprised",
              "angry",
              "bashful",
            ]),
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

conversation.openapi(generateResponseRoute, async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Gemini API key not configured" }, 500);
    }

    const { sessionId, userMessage, systemPrompt } = c.req.valid("json");

    // Check if session exists
    const session = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        gestures: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Save user message
    const savedUserMessage = await prisma.message.create({
      data: {
        role: "user",
        content: userMessage,
        conversationId: sessionId,
      },
    });

    // Build conversation history
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

    // Generate AI response
    const aiResult = await generateConversationResponse(apiKey, {
      messages: conversationHistory,
      systemPrompt,
      gestureSummary: session.gestures
        ? {
            totalSamples: session.gestures.totalSamples,
            smilingSamples: session.gestures.smilingSamples,
            smileIntensityAvg: session.gestures.smileIntensityAvg,
            smileIntensityMax: session.gestures.smileIntensityMax,
            gazeScoreAvg: session.gestures.gazeScoreAvg,
            lookingSamples: session.gestures.lookingSamples,
            gazeUpSamples: session.gestures.gazeUpSamples,
            gazeDownSamples: session.gestures.gazeDownSamples,
          }
        : undefined,
    });

    // Save AI response
    const savedAssistantMessage = await prisma.message.create({
      data: {
        role: "assistant",
        content: aiResult.text,
        conversationId: sessionId,
      },
    });

    return c.json(
      {
        response: aiResult.text,
        emotion: aiResult.emotion,
        userMessage: savedUserMessage,
        assistantMessage: savedAssistantMessage,
      },
      200
    );
  } catch (error) {
    console.error("Failed to generate conversation response:", error);
    return c.json({ error: "Failed to generate conversation response" }, 500);
  }
});

// Generate conversation feedback
const generateFeedbackRoute = createRoute({
  method: "post",
  path: "/feedback",
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
              conversationScore: z.number().nullable().optional(),
              gestureScore: z.number().nullable().optional(),
              voiceScore: z.number().nullable().optional(),
              gestureGoodPoints: z.string().nullable().optional(),
              gestureImprovementPoints: z.string().nullable().optional(),
              voiceMetrics: z.any().nullable().optional(),
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

conversation.openapi(generateFeedbackRoute, async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Gemini API key not configured" }, 500);
    }

    const { sessionId } = c.req.valid("json");

    // Get session and messages
    const session = await prisma.conversation.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        gestures: true,
        feedback: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    if (session.messages.length === 0) {
      return c.json({ error: "No messages found in this session" }, 400);
    }

    // Return existing feedback if available and already migrated
    const existingFeedback = session.feedback;
    const needsRefresh =
      existingFeedback &&
      (existingFeedback.conversationScore === null ||
        existingFeedback.gestureScore === null ||
        existingFeedback.voiceScore === null);

    if (existingFeedback && !needsRefresh) {
      return c.json(
        {
          feedback: existingFeedback,
        },
        200
      );
    }

    // Build conversation history
    const conversationHistory = session.messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Generate feedback (first time or refresh)
    const feedbackData = await generateConversationFeedback(
      apiKey,
      conversationHistory,
      session.gestures
        ? {
            totalSamples: session.gestures.totalSamples,
            smilingSamples: session.gestures.smilingSamples,
            smileIntensityAvg: session.gestures.smileIntensityAvg,
            smileIntensityMax: session.gestures.smileIntensityMax,
            gazeScoreAvg: session.gestures.gazeScoreAvg,
            lookingSamples: session.gestures.lookingSamples,
            gazeUpSamples: session.gestures.gazeUpSamples,
            gazeDownSamples: session.gestures.gazeDownSamples,
          }
        : undefined
    );

    const goodPointsStr = feedbackData.goodPoints;
    const improvementPointsStr = feedbackData.improvementPoints;
    const gestureGoodPointsStr = feedbackData.gestureGoodPoints ?? "";
    const gestureImprovementPointsStr =
      feedbackData.gestureImprovementPoints ?? "";

    console.log("[Feedback] Calculated score breakdown", {
      sessionId,
      conversationScore: feedbackData.conversationScore,
      gestureScore: feedbackData.gestureScore,
      voiceScore: feedbackData.voiceScore,
      overallScore: feedbackData.overallScore,
    });

    let savedFeedback: PrismaFeedback;
    if (existingFeedback) {
      savedFeedback = await prisma.feedback.update({
        where: { id: existingFeedback.id },
        data: {
          goodPoints: goodPointsStr,
          improvementPoints: improvementPointsStr,
          overallScore: feedbackData.overallScore,
          conversationScore: feedbackData.conversationScore,
          gestureScore: feedbackData.gestureScore,
          voiceScore: feedbackData.voiceScore,
          gestureGoodPoints: gestureGoodPointsStr,
          gestureImprovementPoints: gestureImprovementPointsStr,
          voiceMetrics: feedbackData.voiceMetrics as unknown as Prisma.InputJsonValue,
        },
      });
      console.log("[Feedback] Existing record updated with new scores", {
        sessionId,
        feedbackId: savedFeedback.id,
      });
    } else {
      savedFeedback = await prisma.feedback.create({
        data: {
          goodPoints: goodPointsStr,
          improvementPoints: improvementPointsStr,
          overallScore: feedbackData.overallScore,
          conversationScore: feedbackData.conversationScore,
          gestureScore: feedbackData.gestureScore,
          voiceScore: feedbackData.voiceScore,
          gestureGoodPoints: gestureGoodPointsStr,
          gestureImprovementPoints: gestureImprovementPointsStr,
          voiceMetrics: feedbackData.voiceMetrics as unknown as Prisma.InputJsonValue,
          conversationId: sessionId,
        },
      });
      console.log("[Feedback] New feedback created with scores", {
        sessionId,
        feedbackId: savedFeedback.id,
      });
    }

    return c.json({ feedback: savedFeedback }, 200);
  } catch (error) {
    console.error("Failed to generate feedback:", error);
    return c.json({ error: "Failed to generate feedback" }, 500);
  }
});

export default conversation;
