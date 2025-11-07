import { z } from "@hono/zod-openapi";
import { prisma } from "../../lib/prisma";
import { supabase } from "../../lib/supabase";
import { createApiRoute } from "../utils";

const sessions = createApiRoute();

const gestureMetricsSchema = z.object({
	totalSamples: z.number().int().min(0),
	smilingSamples: z.number().int().min(0),
	smileIntensityAvg: z.number().min(0),
	smileIntensityMax: z.number().min(0),
	gazeScoreAvg: z.number().min(0),
	lookingSamples: z.number().int().min(0),
	gazeUpSamples: z.number().int().min(0),
	gazeDownSamples: z.number().int().min(0),
});

// Create new session
sessions.post("/", async (c) => {
	try {
		// Get userId from request body if exists
		const body = await c.req.json().catch(() => ({}));
		const existingUserId = body.userId as string | undefined;

		let userId: string | undefined = existingUserId;

		if (!userId) {
			// Try to create anonymous user (best-effort). If it fails, proceed without userId.
			try {
				const { data, error } = await supabase.auth.signInAnonymously();
				if (error) {
					console.warn("[Session] Anonymous sign-in failed, proceeding without userId:", error.message);
				} else {
					userId = data.user?.id || undefined;
					console.log("[Session] Created anonymous user:", userId);
				}
			} catch (authErr) {
				console.warn("[Session] Anonymous auth threw exception, proceeding without userId:", authErr);
			}
		}

		// Create session (userId is optional in schema)
		const session = await prisma.conversation.create({
			data: userId ? { userId } : {},
		});

		return c.json({ session }, 201);
	} catch (error) {
		console.error("Failed to create session:", error);
		return c.json({ error: "Failed to create session" }, 500);
	}
});

// Get all sessions (optionally filtered by userId)
sessions.get("/", async (c) => {
	try {
		const userId = c.req.query("userId");

		const sessions = await prisma.conversation.findMany({
			where: userId ? { userId } : undefined,
			orderBy: { createdAt: "desc" },
			include: {
				messages: true,
				feedback: true,
			},
		});
		return c.json({ sessions });
	} catch (error) {
		console.error("Failed to fetch sessions:", error);
		return c.json({ error: "Failed to fetch sessions" }, 500);
	}
});

// Get specific session
sessions.get("/:sessionId", async (c) => {
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
		console.error("Failed to fetch session:", error);
		return c.json({ error: "Failed to fetch session" }, 500);
	}
});

// Finish session
sessions.patch("/:sessionId/finish", async (c) => {
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
		console.error("Failed to finish session:", error);
		return c.json({ error: "Failed to finish session" }, 500);
	}
});

// Save gesture data
sessions.post("/:sessionId/gestures", async (c) => {
	try {
		const sessionId = c.req.param("sessionId");
		const body = await c.req.json();
		const parsed = gestureMetricsSchema.safeParse(body);

		if (!parsed.success) {
			return c.json({ error: "Invalid gesture metrics payload" }, 400);
		}

		const session = await prisma.conversation.findUnique({
			where: { id: sessionId },
		});

		if (!session) {
			return c.json({ error: "Session not found" }, 404);
		}

		const metrics = await prisma.gestureMetrics.upsert({
			where: { conversationId: sessionId },
			create: {
				conversationId: sessionId,
				totalSamples: parsed.data.totalSamples,
				smilingSamples: parsed.data.smilingSamples,
				smileIntensityAvg: parsed.data.smileIntensityAvg,
				smileIntensityMax: parsed.data.smileIntensityMax,
				gazeScoreAvg: parsed.data.gazeScoreAvg,
				lookingSamples: parsed.data.lookingSamples,
				gazeUpSamples: parsed.data.gazeUpSamples,
				gazeDownSamples: parsed.data.gazeDownSamples,
			},
			update: {
				totalSamples: parsed.data.totalSamples,
				smilingSamples: parsed.data.smilingSamples,
				smileIntensityAvg: parsed.data.smileIntensityAvg,
				smileIntensityMax: parsed.data.smileIntensityMax,
				gazeScoreAvg: parsed.data.gazeScoreAvg,
				lookingSamples: parsed.data.lookingSamples,
				gazeUpSamples: parsed.data.gazeUpSamples,
				gazeDownSamples: parsed.data.gazeDownSamples,
				updatedAt: new Date(),
			},
		});

		return c.json({ metrics });
	} catch (error) {
		console.error("Failed to save gesture metrics:", error);
		return c.json({ error: "Failed to save gesture metrics" }, 500);
	}
});

export default sessions;
