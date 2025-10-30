import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { prisma } from "../../lib/prisma";

const partners = new OpenAPIHono<{
  Bindings: { ELEVENLABS_API_KEY: string; GEMINI_API_KEY: string };
}>();

const errorResponseSchema = z.object({
  error: z.string(),
});

const partnerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().optional(),
  university: z.string().optional(),
  rating: z.number().optional(),
  isAvailable: z.boolean(),
});

const partnerSessionResponseSchema = z.object({
  sessionId: z.string(),
  roomId: z.string(),
});

const sessionDetailsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  partnerId: z.string(),
  status: z.string(),
  roomId: z.string().nullable(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  duration: z.number().nullable(),
});

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
            partners: z.array(partnerSummarySchema),
          }),
        },
      },
    },
    500: {
      description: "Failed to fetch partners",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

partners.openapi(getPartnersRoute, async (c) => {
  try {
    const partnersList = await prisma.partner.findMany({
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

    const normalizedPartners: z.infer<typeof partnerSummarySchema>[] =
      partnersList.map((partner) => ({
        id: partner.id,
        name: partner.name,
        rating: partner.rating ?? undefined,
        isAvailable: partner.isAvailable,
      }));

    return c.json({ partners: normalizedPartners }, 200);
  } catch (error) {
    console.error("Failed to fetch partners:", error);
    return c.json({ error: "Failed to fetch partners" }, 500);
  }
});

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
          schema: partnerSessionResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to create session",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

partners.openapi(createPartnerSessionRoute, async (c) => {
  try {
    const { userId, partnerId } = c.req.valid("json");

    const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const session = await prisma.humanPartnerSession.create({
      data: {
        userId,
        partnerId,
        status: "waiting",
        roomId,
      },
    });

    const responseBody: z.infer<typeof partnerSessionResponseSchema> = {
      sessionId: session.id,
      roomId: session.roomId ?? roomId,
    };

    return c.json(responseBody, 200);
  } catch (error) {
    console.error("Failed to create session:", error);
    return c.json({ error: "Failed to create session" }, 500);
  }
});

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
    404: {
      description: "Session not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to start session",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

partners.openapi(startPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.valid("param");

    const existingSession = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return c.json({ error: "Session not found" }, 404);
    }

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
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to end session",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

partners.openapi(endPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.valid("param");

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
            session: sessionDetailsSchema,
          }),
        },
      },
    },
    404: {
      description: "Session not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Failed to fetch session",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

partners.openapi(getPartnerSessionRoute, async (c) => {
  try {
    const { sessionId } = c.req.valid("param");

    const session = await prisma.humanPartnerSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const response: z.infer<typeof sessionDetailsSchema> = {
      id: session.id,
      userId: session.userId,
      partnerId: session.partnerId,
      status: session.status,
      roomId: session.roomId ?? null,
      startedAt: session.startedAt ? session.startedAt.toISOString() : null,
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      duration: session.duration ?? null,
    };

    return c.json({ session: response }, 200);
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return c.json({ error: "Failed to fetch session" }, 500);
  }
});

export default partners;
