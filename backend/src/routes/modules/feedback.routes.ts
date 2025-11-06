import { prisma } from "../../lib/prisma";
import { createApiRoute } from "../utils";

const feedback = createApiRoute();

// Add feedback to session
feedback.post("/:sessionId/feedback", async (c) => {
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

		const feedbackData = await prisma.feedback.create({
			data: {
				goodPoints,
				improvementPoints,
				overallScore: overallScore || null,
				conversationId: sessionId,
			},
		});

		return c.json({ feedback: feedbackData }, 201);
	} catch (error) {
		console.error("Failed to create feedback:", error);
		return c.json({ error: "Failed to create feedback" }, 500);
	}
});

export default feedback;
