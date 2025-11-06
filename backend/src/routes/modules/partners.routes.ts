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
							}),
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
		const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
			200,
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

export default partners;
