import { createRoute, z } from "@hono/zod-openapi";
import { prisma } from "../../lib/prisma";
import { createApiRoute } from "../utils";

const partners = createApiRoute();

// Get available partners
const getPartnersRoute = createRoute({
  method: "get",
  path: "/available",
  tags: ["Partners"],
  responses: {
    200: {
      description: "List of available partners",
      content: {
        "application/json": {
          schema: z.object({
            partners: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                age: z.number().optional(),
                university: z.string().optional(),
                rating: z.number().nullable().optional(),
                isAvailable: z.boolean(),
              })
            ),
          }),
        },
      },
    },
    500: {
      description: "Failed to fetch partners",
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

partners.openapi(getPartnersRoute, async (c) => {
  try {
    const partnersList = await prisma.user.findMany({
      where: {
        isAvailable: true,
        role: "partner",
      },
      select: {
        id: true,
        name: true,
        rating: true,
        isAvailable: true,
      },
    });

    return c.json({ partners: partnersList }, 200);
  } catch (error) {
    console.error("Failed to fetch partners:", error);
    return c.json({ error: "Failed to fetch partners" }, 500);
  }
});

// Create partner session
const createPartnerSessionRoute = createRoute({
  method: "post",
  path: "/sessions/create",
  tags: ["Partners"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string(),
            partnerId: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Partner session created",
      content: {
        "application/json": {
          schema: z.object({
            sessionId: z.string(),
            roomId: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Failed to create partner session",
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

partners.openapi(createPartnerSessionRoute, async (c) => {
  try {
    const { userId, partnerId } = await c.req.json();

    // Create session with unique room ID
    const roomId = `room-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

    const session = await prisma.humanPartnerSession.create({
      data: {
        userId,
        partnerId,
        status: "waiting",
        roomId,
      },
    });

    return c.json(
      {
        sessionId: session.id,
        roomId: session.roomId || roomId,
      },
      200
    );
  } catch (error) {
    console.error("Failed to create session:", error);
    return c.json({ error: "Failed to create session" }, 500);
  }
});

// Start partner session
const startPartnerSessionRoute = createRoute({
  method: "post",
  path: "/sessions/{sessionId}/start",
  tags: ["Partners"],
  request: {
    params: z.object({
      sessionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Session started",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    500: {
      description: "Failed to start partner session",
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

partners.openapi(startPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.param();

    await prisma.humanPartnerSession.update({
      where: { id: sessionId },
      data: {
        status: "active",
        startedAt: new Date(),
      },
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("Failed to start session:", error);
    return c.json({ error: "Failed to start session" }, 500);
  }
});

// End partner session
const endPartnerSessionRoute = createRoute({
  method: "post",
  path: "/sessions/{sessionId}/end",
  tags: ["Partners"],
  request: {
    params: z.object({
      sessionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Session ended",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            duration: z.number(),
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
      description: "Failed to end partner session",
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

partners.openapi(endPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.param();

    const session = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const endedAt = new Date();
    const duration = session.startedAt
      ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    await prisma.humanPartnerSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        endedAt,
        duration,
      },
    });

    return c.json({ success: true, duration }, 200);
  } catch (error) {
    console.error("Failed to end session:", error);
    return c.json({ error: "Failed to end session" }, 500);
  }
});

// Get session details
const getPartnerSessionRoute = createRoute({
  method: "get",
  path: "/sessions/{sessionId}",
  tags: ["Partners"],
  request: {
    params: z.object({
      sessionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Session details",
      content: {
        "application/json": {
          schema: z.object({
            session: z.object({
              id: z.string(),
              userId: z.string(),
              partnerId: z.string(),
              status: z.string(),
              roomId: z.string().nullable(),
              startedAt: z.string().nullable(),
              endedAt: z.string().nullable(),
              duration: z.number().nullable(),
            }),
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
      description: "Failed to fetch session",
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

partners.openapi(getPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.param();

    const session = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ session }, 200);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return c.json({ error: "Failed to fetch session" }, 500);
  }
});

// Generate feedback for partner session
const generatePartnerFeedbackRoute = createRoute({
  method: "post",
  path: "/sessions/{sessionId}/feedback/generate",
  tags: ["Partners"],
  request: {
    params: z.object({
      sessionId: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            messages: z
              .array(
                z.object({
                  role: z.string(),
                  content: z.string(),
                  timestamp: z.string().optional(),
                })
              )
              .optional(),
            gestureMetrics: z
              .object({
                totalSamples: z.number(),
                smilingSamples: z.number(),
                smileIntensityAvg: z.number(),
                smileIntensityMax: z.number(),
                gazeScoreAvg: z.number(),
                lookingSamples: z.number(),
                gazeUpSamples: z.number(),
                gazeDownSamples: z.number(),
              })
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Feedback generated",
      content: {
        "application/json": {
          schema: z.object({
            feedback: z.object({
              id: z.string(),
              sessionId: z.string(),
              aiGoodPoints: z.string().nullable(),
              aiImprovementPoints: z.string().nullable(),
              aiOverallScore: z.number().nullable(),
              createdAt: z.string(),
            }),
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
      description: "Failed to generate feedback",
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

partners.openapi(generatePartnerFeedbackRoute, async (c) => {
  try {
    const { sessionId } = c.req.param();
    const body = await c.req.json();
    const { messages, gestureMetrics } = body;

    // Check if session exists
    const session = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
      include: {
        user: true,
        partner: true,
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Check if feedback already exists
    let feedback = await prisma.humanPartnerFeedback.findUnique({
      where: { sessionId },
    });

    if (feedback) {
      // Return existing feedback
      return c.json({ feedback }, 200);
    }

    // Generate AI feedback based on messages and gesture metrics
    let aiGoodPoints = "会話中の姿勢や態度が良好でした。";
    let aiImprovementPoints = "さらに自然な会話を心がけましょう。";
    let aiOverallScore = 70;

    // Analyze gesture metrics if provided
    if (gestureMetrics) {
      const { smileIntensityAvg, gazeScoreAvg, lookingSamples, totalSamples } =
        gestureMetrics;

      const goodPointsList: string[] = [];
      const improvementPointsList: string[] = [];

      // Smile analysis
      if (smileIntensityAvg >= 0.7) {
        goodPointsList.push("笑顔が自然で、相手に好印象を与えていました。");
        aiOverallScore += 5;
      } else if (smileIntensityAvg < 0.3) {
        improvementPointsList.push(
          "もう少し笑顔を意識すると、より親しみやすい印象になります。"
        );
      }

      // Gaze analysis
      if (gazeScoreAvg >= 0.7) {
        goodPointsList.push(
          "視線が適切に相手を見ており、傾聴の姿勢が伝わってきました。"
        );
        aiOverallScore += 5;
      } else if (gazeScoreAvg < 0.4) {
        improvementPointsList.push(
          "相手の目を見る時間を増やすと、より誠実な印象になります。"
        );
      }

      // Looking ratio
      const lookingRatio = totalSamples > 0 ? lookingSamples / totalSamples : 0;
      if (lookingRatio >= 0.6) {
        goodPointsList.push("適度に相手を見る時間が取れていました。");
      } else if (lookingRatio < 0.3) {
        improvementPointsList.push(
          "もう少し相手の方を見る時間を増やしましょう。"
        );
      }

      if (goodPointsList.length > 0) {
        aiGoodPoints = goodPointsList.join(" ");
      }
      if (improvementPointsList.length > 0) {
        aiImprovementPoints = improvementPointsList.join(" ");
      }
    }

    // Analyze messages if provided
    if (messages && messages.length > 0) {
      interface SessionMessage {
        role: string;
        content: string;
        timestamp?: string;
      }

      const userMessages: SessionMessage[] = (
        messages as SessionMessage[]
      ).filter((message: SessionMessage) => message.role === "user");
      const messageCount = userMessages.length;

      if (messageCount >= 10) {
        aiOverallScore += 5;
        aiGoodPoints += " 積極的に会話に参加していました。";
      } else if (messageCount < 3) {
        aiImprovementPoints +=
          " もう少し積極的に話題を提供すると良いでしょう。";
      }
    }

    // Cap score at 100
    aiOverallScore = Math.min(aiOverallScore, 100);

    // Create feedback
    feedback = await prisma.humanPartnerFeedback.create({
      data: {
        sessionId,
        aiGoodPoints,
        aiImprovementPoints,
        aiOverallScore,
      },
    });

    return c.json({ feedback }, 200);
  } catch (error) {
    console.error("Failed to generate feedback:", error);
    return c.json({ error: "Failed to generate feedback" }, 500);
  }
});

// Get partner session feedback
const getPartnerFeedbackRoute = createRoute({
  method: "get",
  path: "/sessions/{sessionId}/feedback",
  tags: ["Partners"],
  request: {
    params: z.object({
      sessionId: z.string(),
    }),
  },
  responses: {
    200: {
      description: "Feedback retrieved",
      content: {
        "application/json": {
          schema: z.object({
            feedback: z
              .object({
                id: z.string(),
                sessionId: z.string(),
                aiGoodPoints: z.string().nullable(),
                aiImprovementPoints: z.string().nullable(),
                aiOverallScore: z.number().nullable(),
                partnerGoodPoints: z.string().nullable(),
                partnerImprovementPoints: z.string().nullable(),
                partnerRating: z.number().nullable(),
                partnerComment: z.string().nullable(),
                createdAt: z.string(),
              })
              .nullable(),
            session: z.object({
              id: z.string(),
              userId: z.string(),
              partnerId: z.string(),
              status: z.string(),
              startedAt: z.string().nullable(),
              endedAt: z.string().nullable(),
              duration: z.number().nullable(),
              partner: z.object({
                id: z.string(),
                name: z.string(),
              }),
            }),
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
      description: "Failed to get feedback",
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

partners.openapi(getPartnerFeedbackRoute, async (c) => {
  try {
    const { sessionId } = c.req.param();

    const session = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
      include: {
        feedback: true,
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json(
      {
        feedback: session.feedback || null,
        session: {
          id: session.id,
          userId: session.userId,
          partnerId: session.partnerId,
          status: session.status,
          startedAt: session.startedAt?.toISOString() || null,
          endedAt: session.endedAt?.toISOString() || null,
          duration: session.duration,
          partner: session.partner,
        },
      },
      200
    );
  } catch (error) {
    console.error("Failed to get feedback:", error);
    return c.json({ error: "Failed to get feedback" }, 500);
  }
});

// List waiting sessions for partners
const listWaitingSessionsRoute = createRoute({
  method: "get",
  path: "/sessions/waiting",
  tags: ["Partners"],
  request: {
    query: z.object({
      partnerId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "Waiting sessions list",
      content: {
        "application/json": {
          schema: z.object({
            sessions: z.array(
              z.object({
                id: z.string(),
                status: z.string(),
                createdAt: z.string(),
                user: z
                  .object({
                    id: z.string(),
                    name: z.string().nullable(),
                    image: z.string().nullable(),
                  })
                  .nullable(),
                partner: z.object({
                  id: z.string(),
                  name: z.string().nullable(),
                }),
              })
            ),
          }),
        },
      },
    },
    500: {
      description: "Failed to fetch waiting sessions",
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

partners.openapi(listWaitingSessionsRoute, async (c) => {
  try {
    const partnerId = c.req.query("partnerId");

    const sessions = await prisma.humanPartnerSession.findMany({
      where: {
        status: "waiting",
        ...(partnerId ? { partnerId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return c.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        createdAt: session.createdAt.toISOString(),
        user: session.user,
        partner: session.partner,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch waiting sessions:", error);
    return c.json({ error: "Failed to fetch waiting sessions" }, 500);
  }
});

export default partners;
